# Tenant Billing API (MVP)

Документ фиксирует route-level контракт tenant-level настроек тарификации для MVP.

## Принципы

- Tenant isolation обязателен: настройка тарификации относится к конкретному tenant.
- Для расчета используется resolved-значение тарифа:
  - если `tenant.connectedMinuteRateRub` задано, используется это значение;
  - если `null`, используется `env.BILLING_CONNECTED_MINUTE_RATE_RUB`.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации параметров пути или тела запроса.
- `TENANT_NOT_FOUND` — tenant не найден.
- `FORBIDDEN` — недостаточно прав для выполнения действия (для `PATCH`).
- `NO_ACTIVE_USER_FOR_TENANT` — у tenant отсутствует активный пользователь для аудита.

### GET: tenant billing settings

`GET /tenants/:tenantId/billing/settings`

#### Параметры пути

- `tenantId` (`string`, UUID)

#### Успешный ответ `200`

```json
{
  "connectedMinuteRateRub": 1.2,
  "resolvedConnectedMinuteRateRub": 1.2
}
```

Или при отсутствии override:

```json
{
  "connectedMinuteRateRub": null,
  "resolvedConnectedMinuteRateRub": 1.2
}
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND`

### PATCH: tenant billing settings

`PATCH /tenants/:tenantId/billing/settings`

#### Параметры пути

- `tenantId` (`string`, UUID)

#### Тело запроса

```json
{
  "connectedMinuteRateRub": 1.5
}
```

Допустимые значения:

- `number` > 0
- `null` (сброс override к env fallback)

#### Успешный ответ `200`

```json
{
  "id": "uuid",
  "connectedMinuteRateRub": 1.5
}
```

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `401` — `USER_ROLE_MISSING` (если пользователь не аутентифицирован)
- `403` — `FORBIDDEN` (роль не входит в `owner`, `integration_admin`)
- `404` — `TENANT_NOT_FOUND`
- `422` — `NO_ACTIVE_USER_FOR_TENANT`

## Ограничение доступа

- Для `PATCH` применяется RBAC с разрешением только для ролей:
  - `owner`
  - `integration_admin`

