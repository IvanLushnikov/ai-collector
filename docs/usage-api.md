# Usage API (MVP)

Документ описывает текущие endpoints для работы с usage ledger в MVP.

## Принципы

- Все операции выполняются в рамках `tenantId` из пути.
- Tenant isolation обязателен: события возвращаются только для запрошенного tenant и кампании.
- Параметры валидации (`tenantId`, `campaignId`, `limit`, `offset`) возвращают `400` с `VALIDATION_ERROR` при нарушениях.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации path/query-параметров.
- `TENANT_NOT_FOUND` — tenant не найден.
- `CAMPAIGN_NOT_FOUND` — кампания не найдена или не принадлежит tenant.
- `USER_ROLE_MISSING` — отсутствует обязательный `X-User-Role`.
- `FORBIDDEN` — роль не имеет доступа к endpoint.

## RBAC

Оба usage endpoint'а требуют заголовок `X-User-Role` из списка:

- `owner`
- `collection_manager`
- `operator`
- `qa_analyst`
- `compliance_officer`
- `integration_admin`

### GET: список usage-событий кампании

`GET /tenants/:tenantId/campaigns/:campaignId/usage-events`

#### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)

#### Параметры запроса

- `limit` (`number`, optional, default `20`, min `1`, max `100`) — число возвращаемых записей.
- `offset` (`number`, optional, default `0`, min `0`, max `1000`) — смещение в отфильтрованном списке.

#### Успешный ответ `200`

```json
[
  {
    "eventType": "call_started",
    "quantity": 1,
    "unit": "call",
    "occurredAt": "ISO-8601"
  },
  {
    "eventType": "call_completed",
    "quantity": 1,
    "unit": "call",
    "occurredAt": "ISO-8601"
  }
]
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`

### GET: итоговые usage-агрегаты кампании

`GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals`

#### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)

#### Успешный ответ `200`

```json
[
  {
    "eventType": "call_completed",
    "unit": "call",
    "totalQuantity": 3
  },
  {
    "eventType": "call_started",
    "unit": "call",
    "totalQuantity": 10
  }
]
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` / `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
