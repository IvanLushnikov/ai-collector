# Campaign Report API (MVP)

Документ описывает route-level контракт для отчета по кампании.

## Принципы

- Tenant isolation обязателен: отчет возвращается только для запрошенного `tenantId` и его `campaign`.
- Сначала проверяется существование tenant и принадлежность кампании tenant.
- Значения KPI в ответе рассчитываются на основе реальных `CallAttempt`, `CallResult`, `ComplianceDecision`, `DebtorRecord` и `UsageEvent` данных.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации параметров пути.
- `TENANT_NOT_FOUND` — tenant не найден.
- `CAMPAIGN_NOT_FOUND` — кампания не существует или не принадлежит tenant.
- `USER_ROLE_MISSING` — отсутствует обязательный `X-User-Role`.
- `FORBIDDEN` — роль не имеет доступа к report API.

## RBAC

Для доступа к `GET /tenants/:tenantId/campaigns/:campaignId/report` необходим заголовок `X-User-Role` со значением:

- `owner`
- `collection_manager`
- `operator`
- `qa_analyst`
- `compliance_officer`
- `integration_admin`

### GET: отчёт кампании

`GET /tenants/:tenantId/campaigns/:campaignId/report`

#### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, UUID)

#### Успешный ответ `200`

```json
{
  "campaignId": "uuid",
  "campaignName": "Q3 Collection Campaign",
  "totalRecords": 100,
  "attemptedCalls": 60,
  "completedCalls": 42,
  "blockedCalls": 5,
  "ptpCount": 12
}
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` или `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
