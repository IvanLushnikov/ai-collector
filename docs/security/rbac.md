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

| Роль | campaigns | debtors import | call start (sandbox) | scripts | telephony | reports | compliance | users/roles | audit log |
|---|---|---|---|---|---|---|---|---|---|
| `owner` | create, update, pause/resume, close campaigns | import, re-import, update mapping | test call, run sandbox campaign waves | create/update/version scripts | connect, test, replace | read all tenant metrics | view decision logs and blocked reasons | read all, invite users, assign roles | read |
| `collection_manager` | create, update, pause/resume, close own campaigns | import/update lists for managed campaigns | run sandbox calls during campaign setup/tests | create/update scripts for campaign | connect/test sandbox provider | read own and campaign reports | view compliance decisions | read users/roles | read |
| `operator` | read campaigns assigned for shift | read only | run sandbox test calls | read | read connected profile | read own/operator dashboard and logs of own attempts | read outcomes and refusal codes | no access | no access |
| `qa_analyst` | read campaigns and settings | no write | no write | read scripts and scenarios | read | read QA dashboards, call outcomes, outcome shares | read compliance history for sampled calls | no access | read |
| `compliance_officer` | read campaigns and safety status | read | no direct call launch; validate safety workflows | read | read provider configs | read audits and incident analytics | block/unblock calls by decision reason (manual review actions) | no access | read |
| `integration_admin` | read campaigns | read base metadata only | no call actions | read/update provider test artifacts | create/update provider credentials, callback and masking config | read usage/telephony impact metrics | read compliance errors | no user edits | read provider-level audit events |

### Примечания по MVP

- Все write-действия должны дополнительно проверять `tenantId` из middleware (в дальнейшем T-042) и запрещать cross-tenant доступ.
- Любые действия с созданием/изменением кампаний, вызовом sandbox call и изменениями интеграций должны попадать в аудит-события, когда будет внедрён `audit log` (согласно roadmap P1).
- Роль `owner` является операционной и иерархической ролью; остальные роли не перезаписывают её разрешения, а реализуются как минимальные разрешения для их зоны ответственности.

