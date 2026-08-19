# RBAC SaaS v1 для AI collector

Документ фиксирует текущий backend-контракт ролей и зон доступа для SaaS v1. Источник истины для проверок находится в серверном authorizer; UI и docs повторяют этот контракт, но не заменяют его.

## Канонические роли

Tenant-контур:

- `tenant_owner`
- `campaign_manager`
- `tenant_viewer`

Platform-контур:

- `platform_admin`
- `support_engineer`

## Legacy alias mapping

Для совместимости в header-based dev/test режиме backend продолжает принимать старые значения `X-User-Role` и нормализует их:

| Legacy role | Canonical role |
|---|---|
| `owner` | `tenant_owner` |
| `collection_manager` | `campaign_manager` |
| `operator` | `tenant_viewer` |
| `qa_analyst` | `tenant_viewer` |
| `compliance_officer` | `tenant_viewer` |
| `integration_admin` | `tenant_owner` |

Legacy aliases нужны только как переходный слой. Для новых интеграций и auth-context используйте канонические роли.

## Зоны доступа

| Role | campaigns | calls | reports | integrations | users | audit_logs |
|---|---|---|---|---|---|---|
| `tenant_owner` | write | write | read | write | write | read |
| `campaign_manager` | write | write | read | read | none | read |
| `tenant_viewer` | read | read | read | none | none | read |
| `platform_admin` | none по tenant-данным | none | none | none | none | none |
| `support_engineer` | none без grant | none без grant | none без grant | none | none | none без grant |

## Специальные правила

- `platform_admin` не получает автоматический доступ к tenant-данным.
- `support_engineer` работает только через явный `SupportAccessGrant`, который ограничен tenant, сроком жизни и аудитом.
- При аутентифицированной cookie-сессии tenant из сессии обязан совпадать с `:tenantId`/body/header запроса. Иначе backend возвращает `TENANT_SCOPE_MISMATCH`.
- Роль из активной сессии не считается окончательной: при наличии `TenantMembership` backend использует актуальную membership-роль, а не устаревший snapshot в `Session`.

## Маршруты v1

- Campaign routes, calls, reports, usage, compliance, telephony, provider credentials и billing settings проверяют доступ через единый zone-based authorizer.
- Review items и `safe-resume` сохраняют более узкие route-level правила поверх общей модели, чтобы не расширить права legacy-ролей во время перехода.
- `GET /tenants/:tenantId/users` и `PATCH /tenants/:tenantId/users/:userId/role` доступны только `tenant_owner`.
- `POST /support/access-grants` и `POST /support/access-grants/:grantId/revoke` доступны только `platform_admin`.

## Audit expectations

Критичные действия должны писать audit event. В текущей реализации это покрывает как минимум:

- изменение статуса кампании и `safe-resume`
- изменение telephony connection
- создание/обновление/ротацию/probe/disable credentials
- смену роли пользователя tenant
- выдачу и отзыв support-доступа
