# Адаптация AI Agent Team под AI Collector

Дата: 20.08.2026  
Статус: дизайн согласован в чате (§1–§4); требуется письменное ревью спеки перед планом и реализацией  
Источник: `ai_agent_team_starter_pack` → `00_bootstrap/MASTER_PROJECT_ADAPTER.md`  
Поверхность: `skills/*` (Layer 3 role agents), `docs/agents/*`, routing в `AGENTS.md` / `CLAUDE.md` / `README.md` / `skills/README.md`, `scripts/verify-skills-bootstrap.mjs`.

## 1. Зачем

В репозитории уже есть skill-first контур (Superpowers process + product/UX craft + `verify:skills`). Starter pack даёт ролевую модель команды (Orchestrator, Product, Architect, Backend/Frontend, QA, Security, DevOps, Release, Docs, Research, Skill Governor) с handoff и обратной связью по skills.

Цель: встроить полный набор ролей в **существующую** систему без параллельной иерархии (`agent-team/`), чтобы агент понимал не только «какой skill процесса», но и **кто владеет зоной**, какие проверки обязательны, куда передавать результат и что эскалировать.

## 2. Решения (зафиксированы)

| Вопрос | Выбор |
|---|---|
| Куда класть | **B** — `docs/agents/` + `skills/<role>/SKILL.md`; обновить routing и verify |
| Объём ролей | **A** — полный набор из pack как отдельные skills |
| Маршрутизатор | **A** — `AGENTS.md` единственный вход; `team-orchestrator` только при мультиролевой задаче / неясном владельце |
| Глубина skills | **Подход 2** — full adapted roles (Mission…NEVER_DO), без замены Layer 0–2 |

## 3. Scope и ограничения

Входит:

- `docs/agents/PROJECT_AGENT_CONTEXT.md`
- `docs/agents/AGENT_WORK_CONTRACT.md`
- `docs/agents/AGENT_HANDOFF_MATRIX.md`
- `docs/agents/AGENT_OWNERSHIP.md`
- `docs/agents/CHANGELOG_AGENT_SKILLS.md`
- `docs/agents/SIMULATION_SCENARIOS.md` (≥5 сценариев)
- `docs/agents/templates/` из pack `13_templates/` (handoff, task, DoD, skill changelog) — не discoverable skills
- 16 role-skills (список ниже) с полным каркасом MASTER_ADAPTER
- обновление Layer map в `skills/README.md` (Layer 3 — Role agents)
- точечные routing-сниппеты в `AGENTS.md`, `CLAUDE.md`, `README.md`
- расширение `scripts/verify-skills-bootstrap.mjs` на новые обязательные `SKILL.md` и сниппеты

Не входит:

- правки продуктового кода / задачи `T-*` в `TECH_BACKLOG_1SP.md`
- удаление или переписывание Layer 0–2 skills
- копирование сырого starter pack в `third_party/` (можно позже отдельной задачей)
- автозапуск мультиагентного оркестратора в CI
- commit без явной просьбы пользователя

Инварианты:

1. Skill-first bootstrap не ломается: вход по-прежнему `AGENTS.md` → `using-superpowers`.
2. Role-skills **вызывают** process/product skills по имени, не копируют их текст.
3. Единица исполнения остаётся **одна 1 SP** задача из backlog, если человек не попросил больше.
4. Compliance fail-closed, tenant isolation, no secrets in code — критические инварианты контекста.
5. `npm run verify:skills` зелёный после внедрения.

## 4. Раскладка артефактов

### 4.1. Governance

```
docs/agents/
  PROJECT_AGENT_CONTEXT.md
  AGENT_WORK_CONTRACT.md
  AGENT_HANDOFF_MATRIX.md
  AGENT_OWNERSHIP.md
  CHANGELOG_AGENT_SKILLS.md
  SIMULATION_SCENARIOS.md
  templates/
    AGENT_HANDOFF_TEMPLATE.md
    AGENT_TASK_TEMPLATE.md
    DEFINITION_OF_DONE.md
    SKILL_CHANGELOG_TEMPLATE.md
```

### 4.2. Role skills (Layer 3)

| Folder | Pack source |
|---|---|
| `team-orchestrator` | TEAM_ORCHESTRATOR |
| `final-reviewer` | FINAL_REVIEWER |
| `product-agent` | PRODUCT_AGENT |
| `architect-agent` | ARCHITECT_AGENT |
| `backend-engineer` | BACKEND_ENGINEER |
| `frontend-engineer` | FRONTEND_ENGINEER |
| `product-designer` | PRODUCT_DESIGNER |
| `qa-engineer` | QA_ENGINEER |
| `test-automation-engineer` | TEST_AUTOMATION_ENGINEER |
| `security-engineer` | SECURITY_ENGINEER |
| `devops-sre` | DEVOPS_SRE |
| `release-manager` | RELEASE_MANAGER |
| `documentation-agent` | DOCUMENTATION_AGENT |
| `research-agent` | RESEARCH_AGENT |
| `skill-governor` | SKILL_GOVERNOR |
| `feedback-analyzer` | FEEDBACK_ANALYZER |

Язык тела skills и `docs/agents/*`: русский. Имена папок и YAML `name`: латиница/kebab-case.

Starter pack в git целиком не копируем — только адаптированное содержимое; происхождение фиксируем в `CHANGELOG_AGENT_SKILLS.md`.

## 5. Ownership зон

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

Полная таблица пар — в `AGENT_HANDOFF_MATRIX.md` при реализации.

## 6. Каркас role-SKILL

Каждый `skills/<role>/SKILL.md`:

Frontmatter: `name`, `description` (Use when…, third-person, лимит 1024 символов).

Секции:

1. Mission  
2. Scope / Out of Scope  
3. Required Context — всегда `docs/agents/PROJECT_AGENT_CONTEXT.md` + `AGENT_WORK_CONTRACT.md` + зоно-специфичные SoT  
4. Sources of Truth — при конфликте: ADR > code > backlog > roadmap  
5. Workflow — шаги; внутри вызов process/product skills по пути  
6. Validation — `npm run test` / `typecheck` / `verify:skills` / ручные чеки по зоне  
7. Handoff — матрица + `docs/agents/templates/AGENT_HANDOFF_TEMPLATE.md`  
8. Escalation + CAN_DO_AUTONOMOUSLY / MUST_ESCALATE / NEVER_DO  
9. Anti-patterns — моки вместо событий, обход compliance, >1 SP, секреты в коде, параллельная «своя» система инструкций  

### 6.1. Антидубли Layer 0–2

- Role не копирует текст brainstorming / TDD / product-design — только ссылка «прочитай skill X».
- `product-agent` — scope/backlog; экраны и RU-копирайт через `ru-ai-collector-product-design` + `russian-product-copy`.
- `product-designer` оркестрирует: ui-ux-audit → product design → interface/frontend-design → ux-design-review.
- `frontend-engineer` / `backend-engineer` — исполнители; process skills внутри Workflow.
- `final-reviewer` дополняет `verification-before-completion`, не заменяет.
- `skill-governor` — единственный меняет skills/routing; остальные сигналят через `feedback-analyzer`.

### 6.2. Routing в AGENTS.md (добавки)

- неясный владелец / 2+ зоны → `team-orchestrator`
- auth / secrets / compliance rule change → `security-engineer` до кода
- CI / Docker / Pages / deploy → `devops-sre`
- улучшение skills / repeated mistakes → `skill-governor`
- остальное — текущие recipes без обязательного orchestrator

## 7. PROJECT_AGENT_CONTEXT (содержание)

Короткий SoT для агентов без повторного ресерча:

1. Product summary — B2B compliance-first коллекшн / Controlled Pilot skeleton  
2. Architecture — Node 20, TS, Fastify, Prisma, PostgreSQL, Redis/BullMQ, Vitest  
3. Repository map — `src/`, `tests/`, `prototype.html`, `public/`, `docs/`, `skills/`  
4. Critical invariants — tenant isolation; dial через compliance fail-closed; audit trail; 1 SP  
5. Security boundaries — secrets/BYOK envelope; CSRF Origin; no live без legal/DPA  
6. Coding conventions — ESLint, TypeScript, существующие модульные границы  
7. Testing — Vitest; `verify:skills` перед test/typecheck  
8. Deployment — local docker-compose; GH Pages для public; CI workflows  
9. Definition of Done — из goal + AGENT_WORK_CONTRACT  
10. Known debt — typecheck/CI история, blocked live Exolve/SpeechKit/retention  
11. Dangerous ops — prod credentials, destructive migrations, live telephony, data deletion  
12. Sources of truth — ADR, rulebook, TECH_BACKLOG, PRODUCT_LANGUAGE, AGENTS.md  
13. Agent ownership map — ссылка на AGENT_OWNERSHIP.md  

## 8. AGENT_WORK_CONTRACT (содержание)

Обязательства каждого агента (из MASTER_ADAPTER §6), плюс проектные:

1. Понять задачу и статус backlog.  
2. Проверить существующую реализацию.  
3. Не создавать дубликаты.  
4. Минимизировать изменения.  
5. Соблюдать архитектуру / ADR.  
6. Проверять security implications.  
7. Обновлять тесты.  
8. Оценивать regression risk.  
9. Обновлять docs при смене поведения.  
10. Фиксировать assumptions.  
11. Не объявлять done без verification skill.  
12. Оставлять понятный handoff.  
13. Не брать >1 SP без явной просьбы.  
14. Не обходить compliance / tenant / secrets rules.

**MUST_ESCALATE (общий):** удаление данных; смена auth model; breaking API; prod credentials; destructive migrations; бизнес-правила без требований; отключение security/compliance; live telephony без legal/DPA; правки bootstrap/`verify:skills` без явной задачи.

## 9. Симуляции (минимум 5)

В `SIMULATION_SCENARIOS.md`:

1. **Feature** — Product → Architect → Security? → Backend → QA → Docs  
2. **Frontend** — Product-designer (+ product/copy) → Frontend → UX review → QA  
3. **Backend/API** — Architect/Backend → Security (если auth/tenant) → Test automation → Docs  
4. **Bugfix** — systematic-debugging → зона-owner → QA  
5. **Deploy/security** — Security + DevOps → Release → Final reviewer (live gates / secrets)

Для каждого: старт, handoffs, валидатор, риск конфликта ролей. Если процесс нелогичен — править skills до зелёного simulation review.

## 10. Порядок внедрения

1. Governance docs: context, work contract, ownership.  
2. Role skills пачками: governance → product/arch → eng → QA/sec/devops → docs/research → governor/feedback.  
3. Handoff matrix + simulations + changelog.  
4. Templates в `docs/agents/templates/`.  
5. Routing + `verify:skills` allowlist.  
6. Прогон `npm run verify:skills`; simulation review; точечные правки.

После утверждения этой спеки — skill `writing-plans` → план → исполнение.

## 11. Acceptance

Считается выполненным, когда:

- [ ] Все файлы из §4.1 существуют и непротиворечивы  
- [ ] Все 16 role-skills существуют с полным каркасом §6  
- [ ] Layer 3 описан в `skills/README.md`  
- [ ] Routing-сниппеты в bootstrap-файлах  
- [ ] `npm run verify:skills` exit 0  
- [ ] ≥5 simulation scenarios записаны  
- [ ] CHANGELOG_AGENT_SKILLS отражает адаптацию от starter pack  

## 12. Риски

| Риск | Митигация |
|---|---|
| Две системы инструкций | Role → ссылки на Layer 0–2; запрет копипаста process skills |
| Раздувание контекста | Короткий PROJECT_AGENT_CONTEXT; keyhole чтение |
| Orchestrator всегда «на всякий случай» | Триггер только мультироль / неясный owner |
| Verify ломает CI | Расширять allowlist атомарно с файлами skills |
