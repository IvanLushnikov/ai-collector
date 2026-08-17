# Telephony API (MVP, route-level docs)

Документ описывает текущие API для управления подключениями телефонии в MVP Lab.

## Принципы

- Все операции выполняются в рамках `tenantId` из пути.
- Tenant isolation обязателен: сущности `tenant` не смешиваются и не пересекаются.
- Роль проверяется через `X-User-Role` middleware.
- `provider`-секреты и токены не хранятся в доменной модели `TelephonyConnection`.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации входящих данных/параметров.
- `TENANT_NOT_FOUND` — tenant не существует.
- `NO_ACTIVE_USER_FOR_TENANT` — нет активного пользователя для выполнения действия.
- `USER_ROLE_MISSING` — отсутствует заголовок `X-User-Role`.
- `FORBIDDEN` — роль не имеет доступа к маршруту.

### POST: создать подключение

`POST /tenants/:tenantId/telephony-connections`

Назначение: создать подключение провайдера для tenant.

#### Права доступа

- `owner`
- `integration_admin`

#### Параметры пути

- `tenantId` (`string`, UUID) — обязательный.

#### Тело запроса

```json
{
  "provider": "string",
  "mode": "sandbox" | "production",
  "status": "active" | "disabled" | "invalid" (по умолчанию `active`),
  "displayName": "string"
}
```

`provider` и `displayName` — обязательны.

#### Успешный ответ `201`

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "provider": "string",
  "mode": "sandbox",
  "status": "active",
  "displayName": "string",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

#### Побочные эффекты

- Пишется запись в `AuditLog`:
  - `action = telephony_connection.created`
  - `entityType = telephonyConnection`
  - `entityId = created telephony connection id`
  - в `metadata` добавляются `provider`, `mode`, `status`, `sourceRoute`.

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
- `404` — `TENANT_NOT_FOUND`
- `422` — `NO_ACTIVE_USER_FOR_TENANT`

### PATCH: обновить подключение

`PATCH /tenants/:tenantId/telephony-connections/:connectionId`

Назначение: изменить `provider`, `displayName` или `status` существующего соединения.

#### Права доступа

- `owner`
- `integration_admin`

#### Тело запроса

Хотя бы одно поле:

```json
{
  "provider": "string",
  "displayName": "string",
  "status": "active" | "disabled" | "invalid"
}
```

`mode` этим маршрутом не меняется.

#### Ограничение

Если `provider` меняется и у tenant есть кампания в `running` или `auto_paused` на этом соединении — `409 TELEPHONY_PROVIDER_LOCKED`. `update` и успешный audit не выполняются.

Смена соединения у самой кампании в `running` / `auto_paused` по-прежнему `409 TELEPHONY_CONNECTION_LOCKED` на `PATCH .../campaigns/:campaignId/telephony-connection`.

#### Успешный ответ `200`

Тот же объект, что после POST.

#### Побочные эффекты

- `AuditLog.action = telephony_connection.updated` только после успешного update.

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
- `404` — `TENANT_NOT_FOUND` или `TELEPHONY_CONNECTION_NOT_FOUND`
- `409` — `TELEPHONY_PROVIDER_LOCKED`
- `422` — `NO_ACTIVE_USER_FOR_TENANT`

### GET: список подключений

`GET /tenants/:tenantId/telephony-connections`

Назначение: получить список подключений провайдера для tenant.

#### Права доступа

- `owner`
- `collection_manager`
- `integration_admin`

#### Параметры пути

- `tenantId` (`string`, UUID) — обязательный.

#### Успешный ответ `200`

```json
[
  {
    "id": "uuid",
    "provider": "string",
    "mode": "sandbox",
    "status": "active",
    "displayName": "string",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
]
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
- `404` — `TENANT_NOT_FOUND`

## Notes

- На все операции наложена проверка tenant: если tenant не существует, возвращается `404` до обращения к данным
  самого tenant.
- Для изменения схемы ответа и ошибок обновить этот документ одновременно с кодом.
