# Audit Logs API (MVP)

Документ описывает контракт endpoint для чтения журнала аудита в MVP.

## Общие требования

- Вся маршрутизация выполняется по tenant scope.
- Tenant isolation обязателен: только события запрошенного `tenantId`.
- Все параметры валидируются перед выполнением бизнес-логики и возвращают `VALIDATION_ERROR` при некорректных значениях.
- Tenant проверяется через общий middleware `GET /tenants/:tenantId/...`.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации `tenantId` или query-параметров (`action`, `entityType`, `campaignId`, `limit`, `offset`), включая `limit > 100` и `offset > 1000`.
- `TENANT_NOT_FOUND` — tenant не найден.
- `CAMPAIGN_NOT_FOUND` — кампания не принадлежит tenant или не существует.
- `USER_ROLE_MISSING` — отсутствует обязательный `X-User-Role`.
- `FORBIDDEN` — роль не имеет прав на endpoint.

## GET: список событий tenant-аудита

`GET /tenants/:tenantId/audit-logs`

Доступ: `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin`.

### Параметры пути

- `tenantId` (`string`, UUID) — обязательный.

### Query-параметры

- `action` (`string`, optional) — точное соответствие поля `action` в событии.
- `entityType` (`string`, optional) — точное соответствие `entityType`.
- `campaignId` (`string`, optional) — фильтрация по `metadata.campaignId` события.
- `limit` (`number`, optional, default `20`, min `1`, max `100`) — число возвращаемых записей.
- `offset` (`number`, optional, default `0`, min `0`, max `1000`) — смещение в отфильтрованном списке.

### Успешный ответ `200`

```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "userId": "uuid",
    "action": "campaign.created",
    "entityType": "campaign",
    "entityId": "uuid",
    "metadata": {
      "name": "string",
      "timezone": "string",
      "source": "api",
      "sourceRoute": "/campaigns"
    },
    "createdAt": "ISO-8601"
  }
]
```

### Ошибки

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`

## Примечания по поведению

- В MVP-реализации фильтрация делается по уже полученным событиям для указанного tenant на уровне приложения.
- Результат отсортирован по `createdAt` убыванием в контрактном виде.

## Metadata: actor type (OP-T-010)

Для смены статуса кампании, автопаузы и safe-resume в `metadata` пишутся additive поля:

- `actorType` — `user` | `system` (кто инициировал действие);
- `actorRole` — опционально, каноническая роль пользователя при `actorType=user` (например `tenant_owner`, `compliance_officer`); PII не пишется.

Правила:

- `campaign.auto_paused` → всегда `actorType: system` (даже если в `userId` указан технический пользователь-триггер);
- `campaign.status_updated` и `campaign.safe_resumed` → `actorType: user` + `actorRole` из RBAC контекста запроса.

Пример автопаузы:

```json
{
  "action": "campaign.auto_paused",
  "metadata": {
    "actorType": "system",
    "reasonCode": "recording_failed",
    "reasonText": "Answered live call has no recording or transcript URL"
  }
}
```

Пример ручной смены статуса:

```json
{
  "action": "campaign.status_updated",
  "metadata": {
    "actorType": "user",
    "actorRole": "tenant_owner",
    "campaignId": "uuid",
    "fromStatus": "draft",
    "toStatus": "review",
    "previousValue": "draft",
    "nextValue": "review"
  }
}
```

## Metadata: previous / next (OP-T-003)

Для критичных переходов (смена статуса кампании, safe-resume) в `metadata` пишутся additive поля:

- `previousValue` — значение до изменения (для статуса — прежний status);
- `nextValue` — значение после изменения;
- `reason` — краткая причина, если известна (например `graceful` / `force` / `safe_resume`);
- совместимость: `fromStatus` / `toStatus` сохраняются; старые события без новых полей валидны.

Пример для остановки кампании:

```json
{
  "action": "campaign.status_updated",
  "metadata": {
    "campaignId": "uuid",
    "fromStatus": "running",
    "toStatus": "completed",
    "previousValue": "running",
    "nextValue": "completed",
    "reason": "graceful",
    "stopMode": "graceful"
  }
}
```

## GET: список событий кампании

`GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`

Доступ: `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin`.

### Параметры пути

- `tenantId` (`string`, UUID) — обязательный.
- `campaignId` (`string`, required) — обязательный.

### Query-параметры

- `action` (`string`, optional) — точное соответствие поля `action` в событии.
- `entityType` (`string`, optional) — точное соответствие `entityType`.
- `limit` (`number`, optional, default `20`, min `1`, max `100`) — число возвращаемых записей.
- `offset` (`number`, optional, default `0`, min `0`, max `1000`) — смещение в отфильтрованном списке.

### Успешный ответ `200`

```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "userId": "uuid",
    "action": "call.sandbox_started",
    "entityType": "callAttempt",
    "entityId": "uuid",
    "metadata": {
      "campaignId": "uuid",
      "outcome": "ptp_created",
      "sourceRoute": "/tenants/tenant-1/campaigns/campaign-1/debtors/debtor-1/calls/sandbox"
    },
    "createdAt": "ISO-8601"
  }
]
```

### Ошибки

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND`
- `404` — `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`

### Примечания по поведению

- Сначала валидируется `tenantId` и `campaignId`.
- Кампания должна принадлежать tenant из пути; в случае расхождения возвращается `CAMPAIGN_NOT_FOUND`.
- В текущей реализации campaign-scope применяется в дополнительной фильтрации по `entityId` (для `entityType=campaign`) и `metadata.campaignId` (для других сущностей).
