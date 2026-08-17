# Calls API (MVP)

Документ фиксирует route-level контракты для операций с попытками звонков.

## Общие требования

- Tenant isolation: все пути начинаются с `tenantId` и выполняют проверку существования tenant.
- Важно: sandbox-вызов перед стартом всегда проходит через compliance engine.
- По каждому звонку фиксируются `CallAttempt`, `CallResult`, `ComplianceDecision` (если включён compliance-log), `UsageEvent` (для sandbox-старта).
- Роли доступа (через `X-User-Role`):
  - sandbox start: `owner`, `collection_manager`, `operator`.
  - список/карточка звонков: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.

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
  - `FORBIDDEN` для роли без доступа (для `sandbox start`: разрешены только `owner`, `collection_manager`, `operator`)
  - `COMPLIANCE_BLOCK` (`allowed: false`, список `reasons`, список `rules`)
- `409`:
  - `CAMPAIGN_NOT_READY` (readiness `blocked` или `stale`)
  - `SCRIPT_VERSION_MISSING` (нет активной версии сценария)
- `404`:
  - `TENANT_NOT_FOUND`
  - `CAMPAIGN_NOT_FOUND`
  - `DEBTOR_RECORD_NOT_FOUND`

Для роли доступа к `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox` допустимы:

- `owner`
- `collection_manager`
- `operator`

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
