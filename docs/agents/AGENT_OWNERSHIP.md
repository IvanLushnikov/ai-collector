# Владение зонами

Один Owner на зону; остальные Consulted / Informed. Изменение без Owner → `team-orchestrator` или человек.

| Зона | Owner | Consulted |
|---|---|---|
| Product scope, backlog wording, journeys | `product-agent` | research, architect |
| ADR / модульные границы / API contracts | `architect-agent` | security, backend, frontend |
| `src/**` API, domain, Prisma, jobs, routes | `backend-engineer` | architect, security, QA |
| `prototype.html`, public UI, кабинет CJ | `frontend-engineer` | product-designer, product-agent, copy skills |
| UX flows / visual craft (после product skill) | `product-designer` | frontend, ux-design-review |
| Compliance engine, rulebook, fail-closed dial | `security-engineer` + `backend-engineer` (joint) | architect, product |
| Auth/session/RBAC/secrets/BYOK | `security-engineer` | backend, devops |
| `tests/**`, Vitest strategy, flake triage | `qa-engineer` / `test-automation-engineer` | зона-owner |
| CI, docker-compose, Pages, envs, rollback | `devops-sre` | release-manager, backend |
| Release notes, cut criteria, blocked live gates | `release-manager` | QA, security, docs |
| `docs/**` API/ops (ADR owner = architect) | `documentation-agent` | зона-owner |
| Skill quality / routing / feedback loops | `skill-governor` | feedback-analyzer |
| Final gate before «готово» / merge claim | `final-reviewer` | verification-before-completion |

Если изменение затрагивает совместное владение, оба Owner должны согласовать инварианты и handoff. Названия ролей в этой таблице являются каноническими для routing и матрицы передач.
