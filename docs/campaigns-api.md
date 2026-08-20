# Campaigns API (MVP)

Документ фиксирует route-level контракты чтения кампаний для MVP.

## Принципы

- Tenant isolation обязателен: все запросы выполняются в контексте `tenantId` из пути и проверкой существования tenant.
- Список кампаний всегда возвращается только для запрошенного tenant.
- Сортировка списка кампаний: `createdAt` по возрастанию.
- Карточка кампании возвращает агрегаты: `debtorRecordsCount`, `callAttemptsCount`, `complianceBlocksCount`.

## Pause-before-edit (OP-T-006)

Пока кампания в статусе `running` или `auto_paused`, критичные настройки нельзя менять без явной паузы / смены статуса:

| Действие | Код | HTTP |
|---|---|---|
| `POST .../campaigns/:campaignId/scripts` | `SCRIPT_VERSION_LOCKED` | `409` |
| `PATCH .../campaigns/:campaignId/telephony-connection` | `TELEPHONY_CONNECTION_LOCKED` | `409` |

После перехода в статус вне `{running, auto_paused}` (например `review`, `ready`, `completed`) edit снова разрешён, если иное не запрещено. UI-подсказка: «Сначала приостановите кампанию.»

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
      "completedCalls": 890,
      "totalRecords": 4200
    }
  }
]
```

- `statusReason` — человекочитаемая причина при `auto_paused` (из последнего audit `campaign.auto_paused`); иначе `null`.
- `progress` — additive агрегаты прогресса кампании (OP-T-008). Старые клиенты могут игнорировать отдельные поля.

#### Прогресс кампании (`progress`)

| Поле | Знаменатель / числитель | Источник | Назначение UI |
|---|---|---|---|
| `totalRecords` | **Знаменатель** — все записи базы кампании (`DebtorRecord`) | `count(debtorRecord where campaignId)` | «из N» в списке и % в обзоре |
| `completedCalls` | **Числитель (предпочтительный)** — завершённые диалоги по событиям | Та же логика, что `completedCalls` в campaign report (см. ниже) | «Завершено X из N», % обзвона |
| `attemptedCalls` | Доп. метрика — все попытки звонка (`CallAttempt`) | `count(callAttempt where campaignId)` | Fallback числителя, если `completedCalls` недоступен клиенту |

**Что считается `completedCalls` (числитель):**

1. Если доступен usage ledger (`usageEvent.findMany`): сумма `quantity` по событиям `eventType=call_completed`, `unit=call` (dedupe по `sourceId` через usage ledger totals — как в report API).
2. Иначе, если есть только `usageEvent.count`: число событий `call_completed` кампании.
3. Иначе (fallback): число `CallAttempt` со `status=completed`.

**Что считается `totalRecords` (знаменатель):** все импортированные записи должников кампании, независимо от исхода звонка.

**UI-рекомендация:** показывать `completedCalls / totalRecords`; `attemptedCalls / totalRecords` — только fallback для старых ответов без `completedCalls`. Процент: `round(completedCalls / totalRecords * 100)` при `totalRecords > 0`.

Согласованность с report API: `GET .../campaigns/:campaignId/report` возвращает те же `completedCalls` и `totalRecords` для одной кампании; список агрегирует их per-row без отдельного report-fetch для прогресса.

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

## Остановка кампании: graceful vs force (OP-T-002a / OP-T-002b)

Канонический статус остановки в домене и API — **`completed`**. Отдельный enum `stopped` / `force_stopped` **не вводится**.

Связанные UI-термины: `PRODUCT_LANGUAGE.md` — «Приостановить кампанию» (локальная пауза) vs «Остановить» → `completed`.

### Контракт `stopMode` (реализовано)

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

| `stopMode` | Поведение сейчас | Audit |
|---|---|---|
| `graceful` (default) | Не создавать новые попытки; статус → `completed`. Активные попытки этим PATCH не прерываются. | `campaign.status_updated` + `stopMode=graceful`, `forceInterruptsActiveAttempts=false` |
| `force` | Статус → `completed` (новые попытки не планируются). Для **sandbox** активные in-flight попытки (`initiated`/`queued`/`ringing`/`answered`) прерываются через `hangupCall` voice provider adapter; попытка обновляется (`endedAt`, `disconnectInitiator=campaign_force_stop`). **Live Exolve/Mango HTTP hangup** — отложено (`T-149` blocked); такие попытки в audit помечаются `skippedActiveAttemptsProvider`. | `campaign.status_updated` + `stopMode=force`, `forceInterruptsActiveAttempts=true`, `interruptedActiveAttempts`, `skippedActiveAttemptsProvider` |

Инварианты:

1. **Нет обхода compliance:** Force не разрешает звонок, который был заблокирован проверкой ограничений; не снимает `auto_paused` и не подменяет safe-resume.
2. **Нет нового статуса:** оба режима заканчиваются в `completed`.
3. **UI:** Force («Остановить немедленно») — отдельная ветка в статус-меню кабинета (`OP-D-014`); graceful — «Остановить кампанию». Sandbox interrupt реализован (`OP-T-012`); live hangup — после `T-149` (copy предупреждает об ограничении).

### Связь с pause

| Действие | Эффект | Статус API |
|---|---|---|
| Приостановить | Новые звонки не создаются; можно продолжить обзвон | UI `manual_paused` (не PATCH `completed`) |
| Остановить (graceful) | Кампания завершена; нужен новый запуск | `completed` + `stopMode=graceful` |
| Остановить немедленно (force) | Sandbox: прерывает активные звонки + `completed`; live — audit skip до `T-149` | `completed` + `stopMode=force` |
