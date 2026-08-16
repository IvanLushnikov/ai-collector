# Calls API (MVP)

Документ фиксирует route-level контракты для операций с попытками звонков.

## Общие требования

- Tenant isolation: все пути начинаются с `tenantId` и выполняют проверку существования tenant.
- Важно: sandbox-вызов перед стартом всегда проходит через compliance engine.
- По каждому звонку фиксируются `CallAttempt`, `CallResult`, `ComplianceDecision` (если включён compliance-log), `UsageEvent` (для sandbox-старта).

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
- `403`:
  - `COMPLIANCE_BLOCK` (`allowed: false`, список `reasons`, список `rules`)
- `404`:
  - `TENANT_NOT_FOUND`
  - `CAMPAIGN_NOT_FOUND`
  - `DEBTOR_RECORD_NOT_FOUND`

## GET: Список звонков кампании

`GET /tenants/:tenantId/campaigns/:campaignId/calls`

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

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND`

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
