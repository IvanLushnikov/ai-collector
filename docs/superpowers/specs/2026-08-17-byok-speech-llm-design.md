# BYOK ASR / TTS / LLM — design spec

Дата: 17.08.2026  
Статус: к реализации по задачам 1 SP  
ADR: [0005-byok-speech-llm.md](../../decisions/0005-byok-speech-llm.md)

## 1. Зачем

Продукт вызывает SpeechKit (ASR/TTS) и YandexGPT/GigaChat (LLM) от имени tenant. Без BYOK все арендаторы делят ключ платформы: нельзя развести договоры обработки ПДн, квоты и себестоимость.

BYOK = tenant передаёт **данные для подключения** своего облачного контура. Оркестратор, compliance engine и state machine не меняются.

## 2. As-is

| Слой | Сейчас |
|---|---|
| ASR/TTS/LLM в коде | нет; контракты запланированы как `T-150`–`T-152`, скелет Yandex — `T-156` |
| Секреты | только process env (`JWT_SECRET`, биллинг). Ключей SpeechKit нет |
| Телефония | `TelephonyConnection` без секрета; токены задуманы в env |
| Биллинг v0 | минуты звонка / successful dialog / storage; единиц ASR/TTS/LLM нет |
| UI | раздел «Телефония»; экрана «Речь и модель» нет |
| 152‑ФЗ | иностранный cloud ASR/LLM для должника запрещён (ADR 0004, rulebook R-LOCALIZATION) |

Вывод: BYOK нельзя повесить на существующий secret store — его нет. Нельзя ждать live HTTP SpeechKit (`T-157`, blocked): CRUD ключей, шифрование и resolver делаются на fake-адаптерах.

## 3. Инварианты

1. Один активный credential на пару `(tenantId, capability)` где `capability ∈ {asr, tts, llm}`.
2. Allowlist: `asr|tts → yandex_speechkit`; `llm → yandexgpt | gigachat`.
3. API никогда не возвращает plaintext, ciphertext, nonce, authTag.
4. Audit пишет `capability`, `provider`, `mode`, `secretHint`, результат probe — не секрет.
5. Расшифровка только в resolver/probe/adapter factory, в том же процессе. Логи не содержат ключ.
6. Иностранный provider → `422 PROVIDER_NOT_ALLOWED`, запись не создаётся.
7. Production/live без ключа → `409 SPEECH_CREDENTIAL_MISSING`. Sandbox + fake — допускается.

## 4. Модель данных

### `ProviderCredential`

Tenant-scoped подключение речи/модели. Секрета в строке нет.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID PK | |
| `tenantId` | UUID FK | изоляция |
| `capability` | enum `asr` `tts` `llm` | какой адаптер |
| `provider` | enum `yandex_speechkit` `yandexgpt` `gigachat` | allowlist |
| `mode` | enum `platform` `byok` | откуда ключ |
| `status` | enum `inactive` `pending_probe` `active` `invalid` `disabled` | |
| `displayName` | string | имя в кабинете |
| `secretHint` | string nullable | последние 4 символа ключа; для `platform` — null |
| `metadata` | JSON | только allowlisted не-секреты: `folderId`, `modelId` |
| `lastProbedAt` | timestamp nullable | |
| `lastProbeResult` | enum `ok` `failed` nullable | |
| `createdAt` `updatedAt` | timestamp | |

Уникальность: `@@unique([tenantId, capability])` — вторая активная запись на ту же capability не создаётся (`409 CREDENTIAL_ALREADY_EXISTS`). Замена ключа — `PATCH` той же строки.

`mode=platform`: поле секрета в запросе запрещено (`400 VALIDATION_ERROR`). Probe проверяет env.

`mode=byok`: `apiKey` обязателен на create и на rotate.

### `CredentialSecret`

Отдельная таблица, 1:1 к `ProviderCredential`. List/GET credential её не `select`.

| Поле | Тип |
|---|---|
| `id` | UUID PK |
| `tenantId` | UUID |
| `providerCredentialId` | UUID unique FK, onDelete Cascade |
| `ciphertext` | bytes |
| `nonce` | bytes (12) |
| `authTag` | bytes (16) |
| `keyVersion` | int, default 1 |
| `createdAt` `updatedAt` | timestamp |

## 5. Шифрование v1

Модуль `src/secrets/envelope.ts`.

- Алгоритм: AES-256-GCM.
- Ключ: `CREDENTIALS_ENCRYPTION_KEY` — 32 байта, hex 64 символа. Без ключа процесс не стартует в `production`; в `test` допускается fixed fixture только в тестах.
- `encryptSecret(plaintext: string): { ciphertext: Buffer; nonce: Buffer; authTag: Buffer }`
- `decryptSecret(...) : string`
- `secretHintFromKey(apiKey: string): string` — последние 4 символа; если длина < 4 → `****`.

Vault/Lockbox — этап 2 карты технологий, не эта спека. Смена `keyVersion` без re-encrypt существующих строк в v1 не делается: один ключ платформы.

## 6. Resolver

`src/speech/credentials/resolve.ts`

```ts
export type SpeechCapability = 'asr' | 'tts' | 'llm';

export type ResolvedSpeechCredential = {
  tenantId: string;
  capability: SpeechCapability;
  provider: 'yandex_speechkit' | 'yandexgpt' | 'gigachat';
  mode: 'platform' | 'byok';
  apiKey: string;
  metadata: { folderId?: string; modelId?: string };
};

export type ResolveSpeechCredentialError =
  | 'SPEECH_CREDENTIAL_MISSING'
  | 'SPEECH_CREDENTIAL_DISABLED'
  | 'SPEECH_CREDENTIAL_INVALID'
  | 'SPEECH_CREDENTIAL_DECRYPT_FAILED';

export function resolveSpeechCredential(input: {
  tenantId: string;
  capability: SpeechCapability;
  requireActive?: boolean; // default true for live
}): Promise<ResolvedSpeechCredential>;
```

Порядок:

1. Найти `ProviderCredential` по `(tenantId, capability)`.
2. Нет строки или `mode=platform` → взять env:
   - ASR/TTS: `YANDEX_SPEECHKIT_API_KEY`, опционально `YANDEX_FOLDER_ID`
   - LLM `yandexgpt`: `YANDEXGPT_API_KEY`, опционально `YANDEX_FOLDER_ID`
   - LLM `gigachat`: `GIGACHAT_API_KEY`
   - пустой env → `SPEECH_CREDENTIAL_MISSING`
3. `mode=byok`:
   - `status=disabled` → `SPEECH_CREDENTIAL_DISABLED`
   - `status=invalid` при `requireActive` → `SPEECH_CREDENTIAL_INVALID`
   - иначе decrypt `CredentialSecret`; ошибка decrypt → `SPEECH_CREDENTIAL_DECRYPT_FAILED` (fail-closed, не fallback на platform: иначе чужой ключ молча подменится нашим).
4. Fake/sandbox адаптер вызывается **минуя** resolver, если `VOICE_DIALOGUE_FAKE=true` или тестовый double.

Адаптеры получают `ResolvedSpeechCredential`, не читают `process.env` сами. Platform env читает только resolver.

## 7. HTTP API

Базовый путь: `/tenants/:tenantId/provider-credentials`

Роли write (`POST`/`PATCH`/`probe`/`disable`): `owner`, `integration_admin`.  
Роли read (`GET`): `owner`, `integration_admin`, `collection_manager` (только статус, без намёка на ротацию).

### POST — создать

Тело:

```json
{
  "capability": "asr",
  "provider": "yandex_speechkit",
  "mode": "byok",
  "displayName": "SpeechKit ФинЛиния",
  "apiKey": "AQVN...",
  "metadata": { "folderId": "b1g..." }
}
```

- `201` без `apiKey`. Есть `secretHint`.
- `status` после create: `pending_probe` для `byok`, `inactive` для `platform` до успешного probe.
- Побочный эффект: `AuditLog.action = provider_credential.created`.

### GET list

Массив без секрета. Поля: `id`, `capability`, `provider`, `mode`, `status`, `displayName`, `secretHint`, `metadata`, `lastProbedAt`, `lastProbeResult`, timestamps.

### PATCH `/:id` — ротация или metadata

`apiKey` опционален. Если передан — перешифровать `CredentialSecret`, обновить `secretHint`, сбросить статус в `pending_probe`. Пустой `apiKey` на `byok` не валиден.

`AuditLog.action = provider_credential.rotated` только если секрет менялся, иначе `provider_credential.updated`.

### POST `/:id/disable`

`status=disabled`. Decrypt больше не отдаётся resolver. `AuditLog.action = provider_credential.disabled`.

Повторный enable не делаем отдельным ресурсом: новый `PATCH` с ключом + probe.

### POST `/:id/probe`

Вход без тела. Реализация v1 — **контрактный probe без обязательной сети**:

- `src/speech/credentials/probe.ts` вызывает порт `SpeechCredentialProbe`.
- Fake: ключ непустой и provider в allowlist → `ok`; иначе `failed`.
- Позже `T-157` подменит fake на IAM/list-voices ping без ПДн должника.

Успех: `status=active`, `lastProbeResult=ok`. Провал: `status=invalid`.  
`AuditLog.action = provider_credential.probed` с `result`, без ключа.

Ошибки: как у telephony API плюс `409 CREDENTIAL_ALREADY_EXISTS`, `422 PROVIDER_NOT_ALLOWED`, `409 SPEECH_CREDENTIAL_MISSING` на live-старте.

## 8. Стык с адаптерами и звонком

Зависимость: `T-150`–`T-152` (контракты), `T-156` (скелет Yandex).

- Factory адаптера: `(credential: ResolvedSpeechCredential) => AsrAdapter`.
- Live/production start (будущий `POST .../calls/live` и любой non-fake путь) резолвит **три** capability. Любая ошибка resolver → звонок не стартует, `CallAttempt` не создаётся.
- `POST .../calls/sandbox` с fake voice provider **не** требует credentials.
- Если sandbox начнёт ходить в реальный SpeechKit — тот же fail-closed, отдельная задача не нужна: условие «не fake».

## 9. Usage и биллинг

Новые `UsageEventType` (отдельные 1 SP): `asr_units`, `tts_units`, `llm_units`.

`UsageEvent` расширяется полем `credentialMode` enum `platform | byok | fake` (default `fake` для текущего sandbox).

Billing mapper v1: единицы speech с `credentialMode=byok` **не** суммируются в platform invoice. Операционный отчёт кампании их показывает (себестоимость tenant, не наш COGS).

Пока адаптеры не шлют usage — схема и mapper готовятся раньше live HTTP, чтобы не переписывать ledger.

## 10. Readiness

В `readiness-summary` новый check `speech_credentials`:

- sandbox/fake: `ok` всегда.
- production-ready: для `asr`, `tts`, `llm` есть `status=active` BYOK **или** resolver находит platform env.

Текст для кабинета (не коды API): «Речь и модель не готовы. Подключите ключи в разделе интеграций.»

## 11. UI (кабинет)

Экран только для `owner` / `integration_admin`. Глобальные «Интеграции», блок **«Речь и модель»** рядом с телефонией — не внутри кампании.

Три карточки: «Распознавание речи», «Голос», «Модель диалога». Статусы: «не настроено» / «ключ платформы» / «свой ключ» / «ошибка подключения» / «отключено».

Модалка: поставщик из allowlist, поле ключа `type=password`, каталог (`folderId`) для Yandex, кнопки «Сохранить» и «Проверить подключение». После сохранения ключ не показывается, только «ключ ···4242».

Менеджер кампании на readiness видит только статус, без формы ключа.

Запрещено в UI: ASR, TTS, LLM, BYOK, API key как заголовок, OpenAI.

## 12. Порядок 1 SP

Все задачи в `TECH_BACKLOG_1SP.md` (включая UI `T-181`–`T-183`). Не использовать `DESIGN_BACKLOG_1SP.md` как очередь.

Не стартовать `T-176` (factory) до `T-150`–`T-152`. CRUD ключей (`T-162`–`T-175`) параллелен контрактам адаптеров. В общей очереди репозитория BYOK идёт после Lab hardening (`T-129`, `T-184`–`T-191`), если человек не сказал иначе.

## 13. Тесты (минимум на волну)

- encrypt/decrypt roundtrip; чужой keyVersion/nonce → throw.
- store не читается из другого `tenantId`.
- allowlist отклоняет `openai`.
- create byok → ответ без `apiKey`, секрет в БД не plaintext.
- resolver byok не падает в platform при decrypt fail.
- disable → live resolve ошибка.
- probe fake ok/failed меняет status.
- RBAC: `operator` не пишет credentials.
- audit metadata не содержит ключ.

## 14. Вне скоупа

Per-campaign override, Vault, CMEK, BYOK телефонии, произвольный `baseUrl`, голосовая биометрия, показ полного ключа, fallback byok→platform.
