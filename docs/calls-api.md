# Calls API (MVP)

Документ фиксирует route-level контракты для операций с попытками звонков.

## Общие требования

- Tenant isolation: все пути начинаются с `tenantId` и выполняют проверку существования tenant.
- Важно: sandbox-вызов перед стартом всегда проходит через compliance engine.
- По каждому звонку фиксируются `CallAttempt`, `CallResult`, `ComplianceDecision` (если включён compliance-log), `UsageEvent` (для sandbox-старта).
- `identityVerified` на попытке по умолчанию `false`. Sandbox не ставит true, пока нет state machine.
- Роли доступа:
  - канонические роли SaaS v1: `tenant_owner`, `campaign_manager`, `tenant_viewer`.
  - legacy aliases в header-based dev/test режиме: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
  - sandbox start требует write-доступ к зоне `calls`; список/карточка звонков требуют read-доступ к зоне `calls`.

## POST: Запустить sandbox-звонок

`POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)
- `debtorRecordId` (`string`, UUID)

### Тело запроса

```json
{
  "telephonyConnectionId": "string" // optional
}
```

### Успешный ответ `201`

```json
{
  "allowed": true,
  "decision": "allow",
  "reasons": [],
  "rules": ["call-window", "consent-status", "debt-status"],
  "callStatus": "queued",
  "callAttempt": {
    "id": "uuid",
    "tenantId": "uuid",
    "campaignId": "uuid",
    "debtorRecordId": "uuid",
    "telephonyConnectionId": "string",
    "status": "queued",
    "providerCallId": "string",
    "startedAt": "ISO-8601"
  },
  "callResult": {
    "id": "uuid",
    "tenantId": "uuid",
    "callAttemptId": "uuid",
    "outcome": "ptp_created",
    "qaStatus": "not_reviewed",
    "reason": "sandbox_call_result",
    "transcriptUrl": "sandbox://transcripts/...",
    "recordingUrl": "sandbox://recordings/..."
  }
}
```

### Ошибки

- `400`:
  - `VALIDATION_ERROR`
  - `INVALID_DEBT_AMOUNT`
- `401` — `USER_ROLE_MISSING`
- `403`:
  - `FORBIDDEN` для роли без доступа (для `sandbox start`: фактически `tenant_owner` / `campaign_manager`; legacy aliases нормализуются)
  - `COMPLIANCE_BLOCK` (`allowed: false`, список `reasons`, список `rules`)
- `409`:
  - `CAMPAIGN_NOT_READY` (readiness `blocked` или `stale`; для sandbox-канала production/probe/legalBasis не требуются)
  - `SCRIPT_VERSION_MISSING` (нет активной версии сценария)
  - `SANDBOX_CONNECTION_REQUIRED` (выбранное соединение `mode=production`)
- `422`:
  - `NO_ACTIVE_USER_FOR_TENANT`
  - `UNKNOWN_VOICE_PROVIDER`
- `404`:
  - `TENANT_NOT_FOUND`
  - `CAMPAIGN_NOT_FOUND`
  - `DEBTOR_RECORD_NOT_FOUND`

Для доступа к `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox` допустимы:

- `tenant_owner`
- `campaign_manager`
- `tenant_viewer`

## Sandbox vs live

| | Sandbox `POST .../calls/sandbox` | Live `POST .../calls/live` (skeleton, T-239) |
|---|---|---|
| Соединение | только `TelephonyConnection.mode=sandbox` | только `mode=production` |
| Провайдер | `sandbox` через `VoiceProviderResolver`; неизвестный → `UNKNOWN_VOICE_PROVIDER` | live-адаптер (Exolve/Mango), без fallback на sandbox |
| Маркировка | `sandboxPass` не считается live | probe `marking+recording+handoff`, иначе readiness `TELEPHONY_PROBE_INCOMPLETE` |
| Legal basis | не требуется | `Tenant.legalBasisStatus=confirmed` |
| Compliance | тот же engine до старта | тот же engine + rulebook live gates |
| Feature-flag | не нужен | `LIVE_CALLS_ENABLED=true` (T-148); иначе старт запрещён |
| Вендорский робот | не используется | **не используется**: диалог — наш state machine / LLM, не Exolve Robots / Mango NLU |

## POST: Запустить live-звонок (skeleton)

`POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/live`

Маршрут реализован как fail-closed skeleton: при `LIVE_CALLS_ENABLED=false` ответ `403 LIVE_CALLS_DISABLED`. При включённом флаге возвращает `501 LIVE_CALLS_NOT_IMPLEMENTED` — HTTP Exolve и end-to-end orchestrator ещё не подключены; маршрут не проксирует запрос в sandbox.

### Назначение

Боевой исходящий вызов через `VoiceProviderAdapter` выбранного production-соединения. Вендорский голосовой робот не является мозгом продукта (ADR 0003).

### Права доступа

- `tenant_owner`
- `campaign_manager`

Оператор не стартует live из этого API в v1.

### Fail-closed условия (из rulebook v1 и ADR 0003)

Старт **не** происходит (без `CallAttempt`), если любое из:

1. `LIVE_CALLS_ENABLED` не `true`.
2. Нет/не то tenant или кампания.
3. Readiness `blocked` или `stale` (`channel: 'live'`): нет debtors, нет active script, нет active production connection, `TELEPHONY_PROBE_INCOMPLETE`, `LEGAL_BASIS_NOT_CONFIRMED`, compliance blocks, неверный статус кампании.
4. Соединение не `mode=production` или не принадлежит tenant.
5. Probe не подтвердил marking, recording и handoff (`sandboxPass` недостаточен).
6. `legalBasisStatus ≠ confirmed`.
7. Pre-dial compliance `block` (окно, consent, debt, frequency, suppression).
8. Нет активной `ScriptVersion` с locked disclosure.
9. Провайдер неизвестен резолверу или адаптер `not configured`.
10. Нет доступного handoff-контура (когда live transfer обязателен) — до появления destination остаётся блоком готовности, не обход.

После ответа live-звонка обязательны recording URL и transcript; их отсутствие — автопауза `recording_failed` (T-193), не тема этого контракта.

### Тело запроса (черновик)

```json
{
  "telephonyConnectionId": "uuid"
}
```

Игнорируется, если у кампании уже задано `Campaign.telephonyConnectionId`.

### Ошибки (черновик)

- `403` `LIVE_CALLS_DISABLED` — флаг выключен
- `409` `CAMPAIGN_NOT_READY` / `PRODUCTION_CONNECTION_REQUIRED` / `TELEPHONY_PROBE_INCOMPLETE`
- `403` `COMPLIANCE_BLOCK`
- `422` `UNKNOWN_VOICE_PROVIDER`

## GET: Список звонков кампании

`GET /tenants/:tenantId/campaigns/:campaignId/calls`

### Параметры запроса

- `limit` (`number`, optional, default `20`, min `1`, max `100`) — количество записей.
- `offset` (`number`, optional, default `0`, min `0`, max `1000`) — смещение.
- `outcome` (`string`, optional): `not_called`, `no_answer`, `callback_requested`, `wrong_number`, `ptp_created`, `handoff`, `dispute`, `blocked`, `error`.
- `qaStatus` (`string`, optional): `not_reviewed`, `approved`, `flagged`.

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)

### Успешный ответ `200`

```json
[
  {
    "status": "completed",
    "debtorExternalId": "ext-001",
    "startedAt": "ISO-8601",
    "endedAt": "ISO-8601",
    "outcome": "ptp_created"
  }
]
```

### Ошибки

- `400` — `VALIDATION_ERROR` (в т.ч. при невалидных `outcome` / `qaStatus`, `limit`, `offset`)
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN` (доступ к списку звонков: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`)

## GET: Карточка попытки звонка

`GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)
- `callAttemptId` (`string`, UUID)

### Успешный ответ `200`

```json
{
  "attempt": {
    "id": "uuid",
    "tenantId": "uuid",
    "campaignId": "uuid",
    "debtorRecordId": "uuid",
    "status": "completed",
    "telephonyConnectionId": "uuid",
    "scriptVersionId": "uuid",
    "identityVerified": false,
    "identityVerifiedAt": null,
    "providerCallId": "string",
    "startedAt": "ISO-8601",
    "endedAt": "ISO-8601",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },
  "result": {
    "id": "uuid",
    "outcome": "ptp_created",
    "reason": "sandbox_call_result",
    "transcriptUrl": "sandbox://transcripts/...",
    "recordingUrl": "sandbox://recordings/...",
    "qaStatus": "not_reviewed"
  },
  "evidenceBundle": {
    "callResult": {
      "id": "uuid",
      "outcome": "ptp_created",
      "reason": "sandbox_call_result",
      "transcriptUrl": "sandbox://transcripts/...",
      "recordingUrl": "sandbox://recordings/...",
      "qaStatus": "not_reviewed"
    },
    "complianceDecisions": [
      {
        "id": "uuid",
        "tenantId": "uuid",
        "campaignId": "uuid",
        "debtorRecordId": "uuid",
        "decision": "allow",
        "reasonCode": "consent_given",
        "reasonText": "Consent status is given",
        "ruleVersion": "v1",
        "checkedAt": "ISO-8601"
      }
    ],
    "usageEvents": [
      {
        "id": "uuid",
        "eventType": "call_started",
        "quantity": 1,
        "unit": "call",
        "sourceId": "sandbox-call:provider-call-1:started",
        "occurredAt": "ISO-8601"
      }
    ]
  },
  "complianceDecisions": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "campaignId": "uuid",
      "debtorRecordId": "uuid",
      "decision": "allow",
      "reasonCode": "consent_given",
      "reasonText": "Consent status is given",
      "ruleVersion": "v1",
      "checkedAt": "ISO-8601"
    }
  ],
  "usageEvents": [
    {
      "id": "uuid",
      "eventType": "call_started",
      "quantity": 1,
      "unit": "call",
      "sourceId": "sandbox-call:provider-call-1:started",
      "occurredAt": "ISO-8601"
    }
  ]
}
```

### Ошибки

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND` / `CALL_ATTEMPT_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN` (доступ к карточке звонка: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`)

## PATCH: Обновить QA-статус звонка

`PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa`

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)
- `callAttemptId` (`string`, UUID)

### Тело запроса

```json
{
  "qaStatus": "approved"
}
```

- `qaStatus` (`string`): `approved` | `flagged`

### Успешный ответ `200`

```json
{
  "id": "uuid",
  "qaStatus": "approved"
}
```

### Ошибки

- `400` — `VALIDATION_ERROR` (в т.ч. при неверном `qaStatus`) или `INVALID_QA_STATUS`
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND` / `CALL_ATTEMPT_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN` (доступ к обновлению QA: `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`)
