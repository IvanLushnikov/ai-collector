# Billing model v0

## Цель биллинга в MVP Lab

На MVP этапах AI-коллектор выставляет потребление через прозрачные единицы учёта, пригодные для свода с usage-ledger и последующего перехода к инвойсингу.

## Billing units (v0)

### 1) Connected minute

- Единица: **один подключенный/занятый минутный слот звонка**.
- Источник данных: `usage-events` с `eventType = call_completed` и `unit = minute` (в будущем могут появиться `connected_minute` и `completed_call_minute`).
- Счёт: `SUM(quantity)` по tenant/campaign и окну времени биллинга.
- Почему для v0: прямо отражает реальную связь с поставкой телеком-оператора и затратами на минуты разговора.

### 2) Successful dialog

- Единица: **успешно завершённый диалог**, где AI/оператор довёл звонок до outcome `human_assist`, `ptp_created`, `resolved`, `call_disposition_success` (термины будут закреплены в `CallResult`/outcome контракте).
- Источник данных: `usage-events` с `eventType = call_completed` и `unit = call` **только для outcome из success-пула** (в v0 на этапе внедрения — привязка на уровне отчёта к `CallResult`).
- Счёт: `SUM(quantity)` по выбранным success outcome для tenant/campaign.
- Почему для v0: важен для оценки экономического эффекта и сравнения моделей оплаты.

### 3) Storage (recording + transcript)

- Единица: **хранилище артефактов** (запись + транскрипт) в мегабайтах и днях retention.
- Источник данных: `CallResult`/инфраструктурные метрики (в текущей реализации на MVP это документируется как расчетная метрика по длительности и размеру артефактов до появления детального storage-агрегатора).
- Счёт v0: оценочный (`estimatedStorageBytes`) пока через policy-функцию до появления production-метрик S3/CDN.
- Почему для v0: даёт основу для контроля стоимости и ограничения объёма хранения.

## Какие UsageEvent входят в billing v0

- `call_completed` (unit=`minute`) → **Connected minute**.
- `call_completed` (unit=`call`) при подтверждённых успешных исходах → **Successful dialog**.
- `recording_uploaded` / `transcript_generated` (unit=`mb`, `record`, `transcript` по мере появления в схеме) → **Storage**.

## Привязка к отчётам usage ledger

- `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` пока используется как первичный источник агрегатов.
- Для биллинга v0 рекомендуется вводить mappers:
  - `connectedMinuteBillingUnit(usageTotals)`;
  - `successfulDialogBillingUnit(callResults)`;
  - `storageBillingUnit(storageEstimates)`.
- Каждый mapper должен оставаться tenant/campaign scoped и аудируемым.

## Speech units (v0/v1 заметка)

- Новые `UsageEventType`: `asr_units`, `tts_units`, `llm_units`.
- Поле `credentialMode`: `platform` | `byok` | `fake` (sandbox default `fake`).
- Mapper `sumPlatformSpeechUnits` / `isPlatformBillableUsage`:
  - `credentialMode=byok` **не** входит в platform invoice;
  - `credentialMode=platform` суммируется отдельно от connected minutes;
  - `fake` sandbox speech (когда появится) тоже не входит в platform speech sum.
- Connected minutes по-прежнему считаются из `call_completed` / unit=`minute` и не смешиваются со speech units.

## План готовности к v1 billing

1. **v0 (текущий этап):** единицы, привязанные к `UsageEvent` + `CallResult`, с ручной валидацией mapping.
2. **v1:** отдельный `billing_ledger` и reconciliation с телеком/CDR + инвойсным экспортом.
3. **v2:** автоматическая тарификация multi-unit packages, лимиты и алерты по порогам.
