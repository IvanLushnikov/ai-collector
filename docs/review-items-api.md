# Review Items API (MVP)

Документ фиксирует route-level контракт для ручной обработки review queue.

## Общие требования

- Tenant isolation: все пути начинаются с `tenantId` и выполняют проверку существования tenant.
- Любое действие выполняется в контексте кампании и должно быть привязано к `tenantId` и `campaignId`.
- Роли доступа: для GET и PATCH требуются роли `owner`, `collection_manager`, `qa_analyst`, `compliance_officer` (через `X-User-Role`).

## PATCH: Разрешение review item

`PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve`

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)
- `itemId` (`string`) — формат:
  - `qa-<callResultId>`
  - `compliance-<complianceDecisionId>`

### Тело запроса

```json
{
  "action": "approve",
  "notes": "optional operator note"
}
```

- `action` (`string`): `approve` | `reject` | `escalate` | `requeue`.
- `notes` (`string`, optional): до 4000 символов.

### Успешный ответ `200`

QA-item:

```json
{
  "itemType": "qa",
  "itemId": "qa-result-123",
  "tenantId": "uuid",
  "campaignId": "uuid",
  "debtorRecordId": "uuid",
  "qaStatus": "approved",
  "action": "approve"
}
```

Compliance-item (фиксируется в audit, без изменения решения):

```json
{
  "itemType": "compliance",
  "itemId": "compliance-decision-123",
  "tenantId": "uuid",
  "campaignId": "uuid",
  "debtorRecordId": "uuid",
  "action": "escalate",
  "status": "acknowledged"
}
```

### Ошибки

- `400`:
  - `VALIDATION_ERROR`
  - `INVALID_REVIEW_ITEM_ID`
- `404`:
  - `TENANT_NOT_FOUND`
  - `CAMPAIGN_NOT_FOUND`
  - `REVIEW_ITEM_NOT_FOUND` (включая кейс, когда compliance-решение существует, но сейчас не `block`)
- `422`:
  - `NO_ACTIVE_USER_FOR_TENANT`
- `500`:
  - `REVIEW_RESOLUTION_NOT_SUPPORTED`
