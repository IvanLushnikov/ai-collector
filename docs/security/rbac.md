# RBAC (роль и права) для MVP Lab AI-коллектора

Документ описывает минимальные роли и права для MVP Lab (`P1. RBAC и audit log`) с сохранением tenant isolation.

Роли:

- `owner` — владелец tenant.
- `collection_manager` — руководитель взыскания.
- `operator` — оператор обзвона.
- `qa_analyst` — аналитик качества.
- `compliance_officer` — специалист compliance/юрист.
- `integration_admin` — администратор интеграций.

## Матрица прав (минимальный набор для MVP)

| Роль | campaigns | debtors import | call start (sandbox) | scripts | telephony | provider credentials | reports | compliance | users/roles | audit log |
|---|---|---|---|---|---|---|---|---|---|---|
| `owner` | create, update, pause/resume, close campaigns | import, re-import, update mapping | test call, run sandbox campaign waves | create/update/version scripts | connect, test, replace | create, rotate, disable, probe, read | read all tenant metrics | view decision logs and blocked reasons; open review items, approve/reject/escalate/requeue | read all, invite users, assign roles | read |
| `collection_manager` | create, update, pause/resume, close own campaigns | import/update lists for managed campaigns | run sandbox calls during campaign setup/tests | create/update scripts for campaign | connect/test sandbox provider | read status only | read own and campaign reports | view compliance decisions, act on review queue items (approve/reject/escalate/requeue) | read users/roles | read |
| `operator` | read campaigns assigned for shift | read only | run sandbox test calls | read | read connected profile | no access | read own/operator dashboard and logs of own attempts | read outcomes and refusal codes | no access | no access |
| `qa_analyst` | read campaigns and settings | no write | no write | read scripts and scenarios | read | no access | read QA dashboards, call outcomes, outcome shares | read compliance history for sampled calls; add notes/evidence comments to review items; suggest resolution direction | no access | read |
| `compliance_officer` | read campaigns and safety status | read | no direct call launch; validate safety workflows | read | read provider configs | no access | read audits and incident analytics | block/unblock calls by decision reason; annotate review items; execute manual review decisions (approve/reject/escalate/requeue) | no access | read |
| `integration_admin` | read campaigns | read base metadata only | no call actions | read/update provider test artifacts | create/update provider credentials, callback and masking config | create, rotate, disable, probe, read | read usage/telephony impact metrics | read compliance errors | no user edits | read provider-level audit events |

## Endpoint-level доступ (MVP)

Все эндпоинты ниже используют заголовок `X-User-Role` и возвращают:

- `401 USER_ROLE_MISSING` при отсутствии `X-User-Role`;
- `403 FORBIDDEN` при роли без доступа.

### Calls

- `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`  
  Доступ: `owner`, `collection_manager`, `operator`.
- `GET /tenants/:tenantId/campaigns/:campaignId/calls`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa`  
  Доступ: `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`.

### Campaigns

- `GET /tenants/:tenantId/campaigns`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `GET /tenants/:tenantId/campaigns/:campaignId`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `PATCH /tenants/:tenantId/campaigns/:campaignId/status`  
  Доступ: `owner`, `collection_manager`.

### Отчётность и проверки

- `GET /tenants/:tenantId/campaigns/:campaignId/usage-events`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `GET /tenants/:tenantId/campaigns/:campaignId/report`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`  
  Доступ: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.

### Логи аудита

- `GET /tenants/:tenantId/audit-logs`  
  Доступ: `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`  
  Доступ: `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin`.

### Provider credentials

- `GET /tenants/:tenantId/provider-credentials`  
  Доступ: `owner`, `integration_admin`, `collection_manager`.
- `POST /tenants/:tenantId/provider-credentials`  
  Доступ: `owner`, `integration_admin`.
- `PATCH /tenants/:tenantId/provider-credentials/:credentialId`  
  Доступ: `owner`, `integration_admin`.
- `POST /tenants/:tenantId/provider-credentials/:credentialId/disable`  
  Доступ: `owner`, `integration_admin`.
- `POST /tenants/:tenantId/provider-credentials/:credentialId/probe`  
  Доступ: `owner`, `integration_admin`.

### Примечания по MVP

- Все write-действия должны дополнительно проверять `tenantId` из middleware (в дальнейшем T-042) и запрещать cross-tenant доступ.
- Любые действия с созданием/изменением кампаний, вызовом sandbox call и изменениями интеграций должны попадать в аудит-события, когда будет внедрён `audit log` (согласно roadmap P1).
- Роль `owner` является операционной и иерархической ролью; остальные роли не перезаписывают её разрешения, а реализуются как минимальные разрешения для их зоны ответственности.
