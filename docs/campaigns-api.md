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

## Остановка кампании: graceful vs force (OP-T-002a)

Канонический статус остановки в домене и API — **`completed`**. Отдельный enum `stopped` / `force_stopped` **не вводится**.

Связанные UI-термины: `PRODUCT_LANGUAGE.md` — «Приостановить кампанию» (локальная пауза) vs «Остановить» → `completed`.

### Текущее поведение (до OP-T-002b)

- Остановка через `PATCH /tenants/:tenantId/campaigns/:campaignId/status` с телом `{ "status": "completed" }` при допустимом переходе (сейчас из `running`).
- Смысл по умолчанию — **graceful stop**: кампания перестаёт планировать **новые** попытки; уже созданные попытки не объявляются принудительно прерванными этим контрактом.
- Ручная пауза («приостановлена») — прототипное UI-состояние, **не** Prisma-enum и не отдельный stop-mode API.
- Системная автопауза — статус `auto_paused`; снятие только через safe-resume, не через Force.

### Контракт `stopMode` (OP-T-002b)

Additive на `PATCH .../status` при `status: "completed"` (без нового enum):

```http
PATCH /tenants/:tenantId/campaigns/:campaignId/status
Content-Type: application/json

{ "status": "completed", "stopMode": "graceful" }
```

или

```json
{ "status": "completed", "stopMode": "force" }
```

| `stopMode` | Поведение | Audit |
|---|---|---|
| `graceful` (default) | Не создавать новые попытки; активные дозволить завершиться штатно; статус → `completed` | `campaign.status_updated` + `stopMode=graceful` |
| `force` | Не создавать новые попытки **и** запросить прерывание активных попыток у voice/worker контура; статус → `completed` | отдельное действие/`stopMode=force` |

Инварианты:

1. **Нет обхода compliance:** Force не разрешает звонок, который был заблокирован проверкой ограничений; не снимает `auto_paused` и не подменяет safe-resume.
2. **Нет нового статуса:** оба режима заканчиваются в `completed`.
3. **UI:** Force («Остановить немедленно») — отдельный design-pass после контракта; кабинет по умолчанию шлёт `stopMode: "graceful"` / default.

### Связь с pause

| Действие | Эффект | Статус API |
|---|---|---|
| Приостановить | Новые звонки не создаются; можно продолжить обзвон | UI `manual_paused` (не PATCH `completed`) |
| Остановить (graceful) | Кампания завершена; нужен новый запуск | `completed` |
| Остановить немедленно (force) | Как graceful + прерывание активных | `completed` + `stopMode=force` (после OP-T-002b) |

