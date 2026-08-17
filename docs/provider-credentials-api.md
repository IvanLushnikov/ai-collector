# Provider Credentials API (MVP, route-level docs)

Документ описывает API подключений речи и модели (`ProviderCredential`) для MVP Lab.

## Принципы

- Все операции выполняются в рамках `tenantId` из пути.
- Tenant isolation обязателен: сущности разных tenant не смешиваются.
- Роль проверяется через `X-User-Role`.
- Ответ **никогда** не содержит `apiKey`, `ciphertext`, `nonce`, `authTag`.
- Секрет хранится только в `CredentialSecret` (AES-256-GCM).

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации тела или пути.
- `TENANT_NOT_FOUND` — tenant не существует.
- `PROVIDER_CREDENTIAL_NOT_FOUND` — credential не найден или чужой tenant.
- `CREDENTIAL_ALREADY_EXISTS` — уже есть запись на `(tenantId, capability)`.
- `PROVIDER_NOT_ALLOWED` — провайдер вне allowlist (`asr|tts` → `yandex_speechkit`, `llm` → `yandexgpt|gigachat`).
- `SPEECH_CREDENTIAL_MISSING` — нет platform env для probe `mode=platform`.
- `SPEECH_CREDENTIAL_DISABLED` — credential отключён.
- `SPEECH_CREDENTIAL_DECRYPT_FAILED` — секрет не расшифрован (fail-closed, без fallback на platform).
- `NO_ACTIVE_USER_FOR_TENANT` — нет активного пользователя для аудита.
- `USER_ROLE_MISSING` — нет `X-User-Role`.
- `FORBIDDEN` — роль не имеет доступа.

## RBAC

Write (`POST` create, `PATCH`, `POST .../disable`, `POST .../probe`): `owner`, `integration_admin`.

Read (`GET` list): `owner`, `integration_admin`, `collection_manager`.

`operator` и `qa_analyst` — `403`.

### POST: создать подключение

`POST /tenants/:tenantId/provider-credentials`

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

- `201` без `apiKey`. Для `byok` есть `secretHint` (последние 4 символа).
- `status`: `pending_probe` для `byok`, `inactive` для `platform`.
- `mode=platform`: поле `apiKey` запрещено (`400 VALIDATION_ERROR`).
- `mode=byok`: `apiKey` обязателен.
- Allowlist проверяется до записи (`422 PROVIDER_NOT_ALLOWED`).
- Audit: `provider_credential.created` с `capability`, `provider`, `mode`, `secretHint`, `status`. Без ключа.

### GET: список

`GET /tenants/:tenantId/provider-credentials`

Массив публичных полей: `id`, `tenantId`, `capability`, `provider`, `mode`, `status`, `displayName`, `secretHint`, `metadata`, `lastProbedAt`, `lastProbeResult`, timestamps.

### PATCH: ротация или metadata

`PATCH /tenants/:tenantId/provider-credentials/:credentialId`

`apiKey` опционален. Если передан — перешифровать секрет, обновить `secretHint`, `status=pending_probe`.

Audit: `provider_credential.rotated` если секрет менялся, иначе `provider_credential.updated`.

### POST: отключить

`POST /tenants/:tenantId/provider-credentials/:credentialId/disable`

`status=disabled`. Resolver больше не отдаёт ключ (`SPEECH_CREDENTIAL_DISABLED`).

Audit: `provider_credential.disabled`.

### POST: проверить подключение

`POST /tenants/:tenantId/provider-credentials/:credentialId/probe`

Тело пустое. v1 — контрактный probe без сети (непустой ключ + allowlist → `ok`).

- успех: `status=active`, `lastProbeResult=ok`
- провал: `status=invalid`, `lastProbeResult=failed`

Ответ без ключа. Audit: `provider_credential.probed` с `result`.
