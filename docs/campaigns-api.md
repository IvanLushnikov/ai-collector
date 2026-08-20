# Campaigns API (MVP)

Документ фиксирует route-level контракты чтения кампаний для MVP.

## Принципы

- Tenant isolation обязателен: все запросы выполняются в контексте `tenantId` из пути и проверкой существования tenant.
- Список кампаний всегда возвращается только для запрошенного tenant.
- Сортировка списка кампаний: `createdAt` по возрастанию.
- Карточка кампании возвращает агрегаты: `debtorRecordsCount`, `callAttemptsCount`, `complianceBlocksCount`.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации path-параметров (например, невалидный UUID).
- `TENANT_NOT_FOUND` — tenant не найден.
- `CAMPAIGN_NOT_FOUND` — кампания не существует или не принадлежит tenant (только для `GET /.../:campaignId`).
- `USER_ROLE_MISSING` — отсутствует обязательный `X-User-Role`.
- `FORBIDDEN` — роль не имеет доступа к endpoint.

## RBAC

Для чтения списка и карточки кампаний требуется `X-User-Role` из перечня:

- `owner`
- `collection_manager`
- `operator`
- `qa_analyst`
- `compliance_officer`
- `integration_admin`

### GET: Список кампаний tenant

`GET /tenants/:tenantId/campaigns`

#### Параметры пути

- `tenantId` (`string`, UUID)

#### Параметры запроса

- `limit` (`number`, optional): количество кампаний на странице. По умолчанию `20`. Должно быть целым числом от `1` до `100`.
- `offset` (`number`, optional): смещение в списке. По умолчанию `0`. Должно быть целым числом от `0` до `1000`.

#### Успешный ответ `200`

Массив объектов в порядке возрастания `createdAt`. Поля `updatedAt`, `statusReason` и `progress` — additive (старые клиенты их могут игнорировать):

```json
[
  {
    "id": "uuid",
    "name": "Campaign name",
    "status": "auto_paused",
    "timezone": "Europe/Moscow",
    "createdAt": "2026-08-16T00:00:00.000Z",
    "updatedAt": "2026-08-19T09:30:00.000Z",
    "statusReason": "Нет записи разговора",
    "progress": {
      "attemptedCalls": 1974,
      "totalRecords": 4200
    }
  }
]
```

- `statusReason` — человекочитаемая причина при `auto_paused` (из последнего audit `campaign.auto_paused`); иначе `null`.
- `progress.attemptedCalls` — число попыток звонка; `progress.totalRecords` — число записей базы кампании.

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`

Пагинация применяется через `limit` и `offset`.

### GET: Карточка кампании

`GET /tenants/:tenantId/campaigns/:campaignId`

#### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, min length 1)

#### Успешный ответ `200`

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "Campaign name",
  "status": "ready",
  "timezone": "Europe/Moscow",
  "createdAt": "2026-08-16T00:00:00.000Z",
  "debtorRecordsCount": 120,
  "callAttemptsCount": 44,
  "complianceBlocksCount": 3
}
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` или `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
