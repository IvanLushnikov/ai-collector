# Voice Provider Adapter Contract

## Назначение

Контракт определяет, как MVP-интеграция с телефонией подключается к приложению через адаптер и какие сигналы обязателен для следующих шагов:
- проверки compliance перед стартом звонка;
- фиксации попытки звонка (`CallAttempt`);
- расчёта `UsageEvent` после завершения звонка.

Адаптер должен быть vendor-agnostic: все провайдеры реализуют один и тот же интерфейс.

## Общий интерфейс

Файл: `src/telephony/voice-provider/adapter.ts`

```ts
export type VoiceCallStatus =
  | 'queued'
  | 'ringing'
  | 'answered'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'voicemail'
  | 'busy'
  | 'transferred_to_handoff'
  | 'unknown';

export interface VoiceProviderAdapter {
  startCall(input: StartCallInput): Promise<StartCallResult>;
  getCallStatus(providerCallId: string): Promise<CallStatusResult>;
  hangupCall(providerCallId: string): Promise<HangupCallResult>;
  probeCapabilities(): Promise<VoiceProviderCapabilities>;
  mapVendorStatus?(status: VendorCallStatus): VoiceCallStatus;
}

export type VoiceProviderCapabilities = {
  marking: boolean;
  recording: boolean;
  handoff: boolean;
  sandboxPass: boolean;
  checkedAt: Date;
};
```

### `startCall(input)`

- `input`: `StartCallInput`
  - `tenantId`, `campaignId`, `debtorRecordId`, `phone` — обязательные поля для аудита и идемпотентности.
  - `metadata` — произвольные поля (без секретов).
- Возвращает `StartCallResult`:
  - `providerCallId` — стабильный идентификатор сессии на стороне провайдера (требуется для последующих запросов).
  - `status` — начальный статус по контракту (`queued` или `ringing`).

### `getCallStatus(providerCallId)`

- Возвращает `CallStatusResult`:
  - `providerCallId`
  - `status` — один из статусов `VoiceCallStatus`.

### `probeCapabilities()`

Возвращает `VoiceProviderCapabilities`:

- `marking`, `recording`, `handoff` — live capabilities. Sandbox ставит `false` и не притворяется live-маркировкой.
- `sandboxPass` — явный sandbox-pass (`true` у `SandboxVoiceProvider`).
- `checkedAt` — время проверки.
- Без vendor-полей.

## Статусы звонка и их трактовка

- `queued` — запрос принят, звонок ещё не прозвонил абонента.
- `ringing` — позвонок раздается.
- `answered` — абонент ответил.
- `completed` — нормальное завершение.
- `failed` — техническая ошибка.
- `no_answer` — не взят трубка.
- `voicemail` — попали на автоответчик.
- `busy` — линия занята.
- `transferred_to_handoff` — переведен оператору/человеку.
- `unknown` — статус поставлен для неклассифицируемых ответов провайдера.

### Завершённые статусы

Финальные статусы по контракту (не требуют дальнейших polling-запросов):
`completed`, `failed`, `no_answer`, `voicemail`, `busy`, `transferred_to_handoff`.

## Рекомендуемая интеграция

1. Реализация провайдера должна быть в `src/telephony/{provider-name}`.
2. Внедряется в маршруты через слой dependency-injection (как и зависимость `prisma` сейчас).
3. В случае отсутствия нативных статусов поставщика используйте `mapVendorStatus`.

## Тестируемость

- Провайдер может быть подменён fake/sandbox реализацией на этапе MVP.
- Любые сетевые вызовы провайдера не должны выполняться в unit-тестах core-роутов.

## Sandbox vs live

- Sandbox: `SandboxVoiceProvider`, `mode=sandbox`, `sandboxPass=true`, marking/recording/handoff = false. Маршрут `POST .../calls/sandbox`.
- Live: production connection + `probeCapabilities()` с marking+recording+handoff. Маршрут `POST .../calls/live` **ещё не реализован**; контракт в `docs/calls-api.md`.
- **Вендорский робот не используется.** Exolve Robots / Mango voice robot не заменяют compliance engine, state machine и audit. Адаптер — только telephony (start/status/hangup/probe/transfer), не диалог.

## Multi-provider extension pattern (v0)

Документ расширяет текущий adapter контракт для добавления второго провайдера без изменений API оркестрации звонков.

### 1) Обязательный слой провайдера в приложении

Под каждый провайдер создаётся отдельный модуль:

- `src/telephony/sandbox-provider/*` (текущий)
- `src/telephony/{provider-name}/*` (новый provider)

Каждый модуль экспонирует фабрику/экземпляр, реализующий `VoiceProviderAdapter`.

### 2) Выбор провайдера по tenant/конфигурации

Добавить централизованный `providerResolver` (или передавать через DI-конфиг), который на уровне `campaign`/`tenant` выбирает конкретную реализацию.

Требования:

- `campaign` может использовать только разрешённый в настройках провайдер.
- провайдер передаётся внутрь `route/service` через dependency injection.
- добавление нового провайдера меняет только маппинг в resolver, а не `POST /calls/sandbox` и связанные доменные сервисы.

### 3) Ограничение доменной протечки

Во всех доменных типах нельзя хранить vendor-специфичные поля.

Разрешено держать только provider-agnostic поля:

- `providerCallId`
- `status`/`startedAt`/`endedAt` (нормализованные)
- `failureReason` (если есть)

Нельзя держать в домене:

- `callSid`, `region`, `carrier`, `edge`, `traceId`, `rawSessionPayload` и др. vendor-specific поля.
- Если vendor-данные нужны для диагностики, их хранить в audit/log sink с явной трассой и без влияния на domain model.

### 4) Миграция на второй provider без переписывания orchestrator

Порядок добавления:

1. Реализовать адаптер второго провайдера по одному интерфейсу.
2. Добавить нормализатор статусов (`mapVendorStatus`) без влияния на маршруты.
3. Подключить в `src/telephony/voice-provider/resolver.ts`: известные имена (`sandbox`) резолвятся в адаптер; неизвестные бросают `UnknownVoiceProviderError` без fallback на live.
4. Добавить тесты на контракт (status mapping + basic happy path).
5. Отключить/включить через конфиг без изменения API call flow.

### 5) Тест-практики

- Сохранять vendor integration тесты как отдельный уровень (mock + контракт), а не в core API-тестах.
- Ядро `calls`-роутов продолжает работать с `VoiceProviderAdapter` и `Promise`-интерфейсом.
