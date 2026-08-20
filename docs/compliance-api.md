# Compliance API (MVP)

Документ фиксирует route-level контракт ручной проверки compliance для записи должника.

## Типы блокировки для UI (OP-T-007)

Additive поле `blockKind` помогает кабинету различать исключения без парсинга сырого `reasonCode`:

| `blockKind` | Когда | Пример `reasonCode` |
|---|---|---|
| `permanent` | постоянное исключение (suppression) | `SUPPRESSION_BLOCK` |
| `temporary` | временная блокировка (окно, частота) | `CALL_WINDOW_BLOCK`, `FREQUENCY_LIMIT_BLOCK` |
| `campaign_pause` | кампания приостановлена — новые звонки не создаются | не строка suppression; см. `CAMPAIGN_JOB_BLOCKED` |
| `null` | блок по другим правилам или `allow` | `CONSENT_REVOKED`, `DEBT_STATUS_BLOCK`, … |

`reasonText` для правил suppression/окна/частоты — по-русски, без юридических формулировок сверх rulebook.

## POST: Проверка compliance для debtor record

`POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check`

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)
- `debtorRecordId` (`string`, UUID)

### RBAC

- Требуется `X-User-Role` с одним из значений:
  - `owner`
  - `collection_manager`
  - `operator`
  - `qa_analyst`
  - `compliance_officer`
  - `integration_admin`

### Успешный ответ `200`

```json
{
  "decision": "allow",
  "reasons": [],
  "rules": ["call-window", "consent-status", "debt-status"]
}
```

Или при блокировке:

```json
{
  "decision": "block",
  "reasons": [
    {
      "decision": "block",
      "reasonCode": "SUPPRESSION_BLOCK",
      "reasonText": "Контакт в списке исключений",
      "blockKind": "permanent"
    }
  ],
  "rules": ["suppression"]
}
```

### Ошибки

- `400`:
  - `VALIDATION_ERROR` (невалидный `tenantId`/`campaignId`/`debtorRecordId`)
  - `INVALID_DEBT_AMOUNT`
- `404`:
  - `TENANT_NOT_FOUND`
  - `DEBTOR_RECORD_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`

## GET: Список решений compliance кампании

`GET /tenants/:tenantId/campaigns/:campaignId/compliance-decisions`

### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)

### RBAC

- Требуется `X-User-Role` с одним из значений:
  - `owner`
  - `collection_manager`
  - `operator`
  - `qa_analyst`
  - `compliance_officer`
  - `integration_admin`

### Параметры запроса

- `limit` (`number`, optional, default `20`, min `1`, max `100`) — число возвращаемых записей.
- `offset` (`number`, optional, default `0`, min `0`, max `1000`) — смещение в отфильтрованном списке.
- `decision` (`string`, optional, `allow`/`block`) — фильтр по решению.

### Успешный ответ `200`

```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "campaignId": "uuid",
    "debtorRecordId": "uuid",
    "decision": "allow",
    "reasonCode": "RULE_PASSED",
    "reasonText": "Allowed by policy",
    "blockKind": null,
    "ruleVersion": "v1",
    "checkedAt": "ISO-8601"
  }
]
```

### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
