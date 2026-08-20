# Agent Team Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Встроить полный набор role-agents из starter pack в существующую skill-first систему AI Collector (`docs/agents/*` + `skills/<role>/SKILL.md` + routing + `verify:skills`) без параллельной иерархии.

**Architecture:** `AGENTS.md` остаётся единственным входом. Layer 3 (Role agents) добавляется рядом с Layer 0–2; role-skills вызывают process/product skills по ссылке. Governance-SoT живёт в `docs/agents/`. TDD-контур = расширение `scripts/verify-skills-bootstrap.mjs` (fail → create artifacts → green).

**Tech Stack:** Markdown skills, Node verify script (`scripts/verify-skills-bootstrap.mjs`), существующие bootstrap-файлы репозитория.

**Spec:** `docs/superpowers/specs/2026-08-20-agent-team-adaptation-design.md`  
**Pack source (read-only):** `/tmp/ai_agent_team_starter_pack/ai_agent_team_starter/` (или перераспаковать zip при необходимости)

## Global Constraints

- Placement: только `docs/agents/` + `skills/<role>/`; не создавать `agent-team/`.
- Не удалять и не переписывать Layer 0–2 skills.
- Role-skills на русском; YAML `name` — kebab-case латиница.
- Каркас каждой роли: Mission, Scope, Out of Scope, Required Context, Sources of Truth, Workflow, Validation, Handoff, Escalation, CAN_DO_AUTONOMOUSLY, MUST_ESCALATE, NEVER_DO, Anti-patterns.
- Sources of Truth при конфликте: ADR > code > backlog > roadmap.
- `team-orchestrator` только при мультиролевой задаче или неясном владельце.
- Не трогать продуктовый код / `T-*` backlog.
- Коммиты только если явно попросит человек.
- После правок verify: `npm run verify:skills` → exit 0 и строка `Skill bootstrap verification passed.`

## File map

| Path | Responsibility |
|---|---|
| `docs/agents/PROJECT_AGENT_CONTEXT.md` | Короткий SoT проекта (13 пунктов спеки §7) |
| `docs/agents/AGENT_WORK_CONTRACT.md` | Общий контракт + MUST_ESCALATE |
| `docs/agents/AGENT_OWNERSHIP.md` | Таблица Owner/Consulted |
| `docs/agents/AGENT_HANDOFF_MATRIX.md` | Пары From→To |
| `docs/agents/SIMULATION_SCENARIOS.md` | ≥5 сценариев |
| `docs/agents/CHANGELOG_AGENT_SKILLS.md` | Адаптация от pack |
| `docs/agents/templates/*` | 4 шаблона из pack `13_templates/` |
| `skills/<16 roles>/SKILL.md` | Full adapted roles |
| `skills/README.md` | Layer 3 map |
| `AGENTS.md`, `CLAUDE.md`, `README.md` | Routing snippets |
| `scripts/verify-skills-bootstrap.mjs` | Required skills + snippets |

### Shared role SKILL skeleton (использовать в Tasks 3–6)

Каждый файл начинается так (подставить `NAME` / `DESC` / зоны):

```markdown
---
name: NAME
description: Use when DESC. Do not use when the task clearly belongs to another role owner without consultation.
---

# TITLE

## Mission
…

## Scope
…

## Out of Scope
…

## Required Context
- `docs/agents/PROJECT_AGENT_CONTEXT.md`
- `docs/agents/AGENT_WORK_CONTRACT.md`
- `docs/agents/AGENT_OWNERSHIP.md`
- (зоно-специфичные SoT)

## Sources of Truth
При конфликте: ADR > code > `TECH_BACKLOG_1SP.md` > `ROADMAP_B2B_SAAS.md`.

## Workflow
1. Прочитать Required Context.
2. (вызвать process/product skill по имени, если применимо)
3. Выполнить работу в своей зоне.
4. Validation.
5. Handoff.

## Validation
- Команды / чеки зоны
- Перед «готово»: `skills/verification-before-completion/SKILL.md`

## Handoff
Заполнить `docs/agents/templates/AGENT_HANDOFF_TEMPLATE.md`; см. `AGENT_HANDOFF_MATRIX.md`.

## Escalation
См. MUST_ESCALATE ниже и общий контракт.

## CAN_DO_AUTONOMOUSLY
…

## MUST_ESCALATE
- удаление данных; auth model; breaking API; prod credentials; destructive migrations;
  бизнес-правила без требований; отключение security/compliance; live telephony без legal/DPA;
  правки `verify:skills` / bootstrap без явной задачи
- (роль-специфичные)

## NEVER_DO
…

## Anti-patterns
- моки вместо реальных событий там, где есть модели/журнал
- обход compliance fail-closed
- >1 SP без явной просьбы
- секреты в коде / plain-text
- создание параллельной системы инструкций
```

---

### Task 1: RED — расширить `verify:skills` под Layer 3

**Files:**
- Modify: `scripts/verify-skills-bootstrap.mjs`
- Test: `npm run verify:skills`

**Interfaces:**
- Consumes: существующие `requiredSkillFiles`, `expectedSnippets`
- Produces: новый список required role skills + snippets для Layer 3 / routing / docs.agents references

- [ ] **Step 1: Добавить в `requiredSkillFiles` (в конец массива) ровно эти имена:**

```js
  "team-orchestrator",
  "final-reviewer",
  "product-agent",
  "architect-agent",
  "backend-engineer",
  "frontend-engineer",
  "product-designer",
  "qa-engineer",
  "test-automation-engineer",
  "security-engineer",
  "devops-sre",
  "release-manager",
  "documentation-agent",
  "research-agent",
  "skill-governor",
  "feedback-analyzer",
```

- [ ] **Step 2: В `files` добавить пути governance (assertExists пройдёт по всем values):**

```js
  agentsContext: path.join(repoRoot, "docs", "agents", "PROJECT_AGENT_CONTEXT.md"),
  agentsContract: path.join(repoRoot, "docs", "agents", "AGENT_WORK_CONTRACT.md"),
  agentsOwnership: path.join(repoRoot, "docs", "agents", "AGENT_OWNERSHIP.md"),
  agentsHandoff: path.join(repoRoot, "docs", "agents", "AGENT_HANDOFF_MATRIX.md"),
  agentsSimulations: path.join(repoRoot, "docs", "agents", "SIMULATION_SCENARIOS.md"),
  agentsChangelog: path.join(repoRoot, "docs", "agents", "CHANGELOG_AGENT_SKILLS.md"),
```

- [ ] **Step 3: Расширить `expectedSnippets`:**

В `files.agents` snippets добавить:
- `skills/team-orchestrator/SKILL.md`
- `skills/security-engineer/SKILL.md`
- `skills/skill-governor/SKILL.md`
- `docs/agents/PROJECT_AGENT_CONTEXT.md`

В `files.skillsReadme` snippets добавить:
- `Layer 3 — Role agents`
- `team-orchestrator`
- `skill-governor`

В `files.readme` snippets добавить:
- `docs/agents/PROJECT_AGENT_CONTEXT.md`
- `Layer 3`

- [ ] **Step 4: Запустить RED**

Run: `npm run verify:skills`  
Expected: exit ≠ 0, сообщения `Missing required file:` для role skills и/или `docs/agents/*`, и/или `Missing required snippet`.

---

### Task 2: Governance docs + templates

**Files:**
- Create: все пути из File map `docs/agents/**`
- Copy adapted: templates from `/tmp/ai_agent_team_starter_pack/ai_agent_team_starter/13_templates/`

**Produces:** SoT, на который ссылаются все role-skills.

- [ ] **Step 1: Создать `docs/agents/PROJECT_AGENT_CONTEXT.md`** с разделами 1–13 из спеки §7. Обязательные факты:

  - Product: compliance-first B2B коллекшн, Controlled Pilot skeleton, принцип «автоматизировать только то, что можно безопасно выполнить, объяснить и доказать».
  - Stack: Node 20, TypeScript, Fastify, Prisma, PostgreSQL 16, Redis/BullMQ, Vitest.
  - Map: `src/` (auth, compliance, routes, telephony, speech, dialogue, secrets, jobs…), `tests/`, `prototype.html`, `public/`, `docs/`, `skills/`.
  - Invariants: tenant isolation; dial через compliance fail-closed; audit trail; max 1 SP.
  - Security: BYOK envelope; CSRF Origin; no live без legal memo/DPA; secrets не в git.
  - DoD: goal prompt + work contract; `verification-before-completion`.
  - Debt/blocked: `T-149` Exolve HTTP, `T-157` SpeechKit HTTP, `T-203` retention — до legal/DPA.
  - Dangerous: prod credentials, destructive migrations, live telephony, data deletion.
  - SoT: ADR в `docs/decisions/`, `docs/compliance/rulebook-v1.md`, `TECH_BACKLOG_1SP.md`, `PRODUCT_LANGUAGE.md`, `AGENTS.md`.
  - Ownership: ссылка на `AGENT_OWNERSHIP.md`.

- [ ] **Step 2: Создать `AGENT_WORK_CONTRACT.md`** — пункты 1–14 из спеки §8 + общий MUST_ESCALATE список.

- [ ] **Step 3: Создать `AGENT_OWNERSHIP.md`** — таблица Owner/Consulted из спеки §5 дословно по ролям.

- [ ] **Step 4: Создать `AGENT_HANDOFF_MATRIX.md`** с колонками `From | To | Когда | Что передаётся | Что проверить получателю` минимум для пар:

  Product→Architecture, Architecture→Backend, Architecture→Frontend, Design→Frontend, Backend↔Frontend, Security→Architecture, Security→Backend, QA→Developers, Developers→QA, DevOps↔Backend, QA→Release, Release→Documentation, Feedback→Skill Governor, любой→Final Reviewer (перед merge claim).

- [ ] **Step 5: Создать `SIMULATION_SCENARIOS.md`** — 5 сценариев из спеки §9; каждый: старт, handoffs, валидатор, риск конфликта.

- [ ] **Step 6: Создать `CHANGELOG_AGENT_SKILLS.md`** — запись `2026-08-20`: адаптация starter pack v1.0 → Layer 3; placement B; orchestrator optional; источник zip/path.

- [ ] **Step 7: Скопировать 4 template-файла в `docs/agents/templates/`, в шапке каждой добавить строку «Адаптировано для AI Collector; см. AGENT_WORK_CONTRACT.md».

- [ ] **Step 8: Не ожидаем green verify** (role skills ещё нет) — только убедиться, что markdown файлы существуют:

Run: `ls docs/agents/*.md docs/agents/templates/*.md | wc -l`  
Expected: ≥ 10

---

### Task 3: Role skills — governance + product/arch

**Files:**
- Create: `skills/team-orchestrator/SKILL.md`, `skills/final-reviewer/SKILL.md`, `skills/product-agent/SKILL.md`, `skills/architect-agent/SKILL.md`, `skills/research-agent/SKILL.md`

**Produces:** входные роли цепочки Product/Research → Arch → Review.

Для каждой роли заполнить skeleton. Ключевые отличия:

**`team-orchestrator`**
- Mission: классифицировать задачу, назначить Owner, порядок, не делать всю работу самому.
- Trigger description: Use when задача затрагивает 2+ ownership-зоны или владелец неясен.
- Workflow: прочитать ownership → выбрать Owner/Consulted → execution order → acceptance → validation owners.
- Out of Scope: писать продуктовый код вместо Owner; переопределять ADR без architect; product decisions без product-agent.
- Validation: явный список Owner/Consulted/order в ответе.

**`final-reviewer`**
- Mission: финальный gate перед claim «готово»/merge.
- Workflow: сначала `verification-before-completion`; проверить handoff, DoD, security implications, backlog update если менялся state.
- NEVER_DO: объявлять done при красном verify/test без фикса.

**`product-agent`**
- Mission: scope, journeys, формулировки backlog, соответствие ROADMAP/PRD.
- Required: `ROADMAP_B2B_SAAS.md`, `TECH_BACKLOG_1SP.md`, `docs/product/*`, `PRODUCT_LANGUAGE.md`.
- Workflow: при UI — делегировать в `ru-ai-collector-product-design` / copy skills, не дублировать.
- Out of Scope: реализация API/UI кода без handoff инженерам.

**`architect-agent`**
- Mission: границы модулей, ADR, API contracts, совместимость.
- Required: `docs/decisions/*`, `docs/architecture/*`, `docs/domain-model.md`.
- MUST_ESCALATE: новый ADR без человека при спорном вендоре/legal; breaking API.

**`research-agent`**
- Mission: ресерч вариантов/рынка/tech с фиксацией источников; не принимать product/arch решение за владельцев.
- Handoff: всегда в product или architect с assumptions.

- [ ] **Step 1: Создать 5 SKILL.md с полным каркасом и содержимым выше.**
- [ ] **Step 2: Проверка наличия:**

Run: `for s in team-orchestrator final-reviewer product-agent architect-agent research-agent; do test -f skills/$s/SKILL.md || echo MISSING $s; done`

Expected: пустой вывод.

---

### Task 4: Role skills — engineering + design

**Files:**
- Create: `skills/backend-engineer/SKILL.md`, `skills/frontend-engineer/SKILL.md`, `skills/product-designer/SKILL.md`, `skills/documentation-agent/SKILL.md`

**`backend-engineer`**
- Scope: `src/**` кроме чисто UI; Prisma; routes; jobs; domain; telephony/speech adapters код.
- Workflow: brainstorming/TDD/debugging по типу задачи → реализовать → tests → docs API если контракт изменился.
- Validation: `npm run test`, `npm run typecheck` (после verify:skills), релевантные тесты зоны.
- Consult security на auth/secrets/compliance rule changes.

**`frontend-engineer`**
- Scope: `prototype.html`, `public/`, статичные HTML кабинета/лендинга по задаче.
- Workflow: для кабинета — `ui-ux-audit`? → `ru-ai-collector-product-design` → `russian-product-copy` → `interface-design` → код; для лендинга — `frontend-design`.
- NEVER_DO: хардкод tenant/role после auth-контура; выдуманные метрики вместо API.

**`product-designer`**
- Mission: оркестрация UX; не подменять product-agent по scope.
- Workflow: audit → product design → craft → `ux-design-review`.

**`documentation-agent`**
- Scope: `docs/**` API/ops/product notes; не ADR без architect.
- Validation: ссылки на актуальные пути `src/` / endpoints.

- [ ] Создать 4 SKILL.md.
- [ ] Presence check аналогично Task 3.

---

### Task 5: Role skills — QA, security, devops, release

**Files:**
- Create: `skills/qa-engineer/SKILL.md`, `skills/test-automation-engineer/SKILL.md`, `skills/security-engineer/SKILL.md`, `skills/devops-sre/SKILL.md`, `skills/release-manager/SKILL.md`

**`qa-engineer`**
- Mission: риск-based проверка поведения, negative cases, regression; не «зелёный build = done».
- Handoff обратно разработчику с repro steps.

**`test-automation-engineer`**
- Scope: `tests/**`, Vitest структура, flake triage, расширение coverage границ.
- Workflow: TDD skill при новом поведении.

**`security-engineer`**
- Scope: auth/session/RBAC, secrets/BYOK, CSRF, compliance rules совместно с backend, `docs/security/*`, rulebook.
- Workflow: **до кода** на изменениях auth/secrets/compliance.
- NEVER_DO: ослаблять fail-closed; логировать секреты; live без gates.

**`devops-sre`**
- Scope: `.github/workflows/*`, `docker-compose.yml`, Pages/`public` publish ops, env examples (без секретов), rollback notes.
- Validation: CI-файлы валидны; `npm run verify:skills` в локальном контуре.

**`release-manager`**
- Mission: cut criteria, release notes, blocked live gates (Exolve/SpeechKit/retention), координация QA→Docs.
- NEVER_DO: объявлять production-ready при blocked legal/DPA.

- [ ] Создать 5 SKILL.md + presence check.

---

### Task 6: Role skills — skill maintenance

**Files:**
- Create: `skills/skill-governor/SKILL.md`, `skills/feedback-analyzer/SKILL.md`

**`feedback-analyzer`**
- Mission: собирать сигналы (review, QA, CI, incidents, repeated corrections, bad handoffs) → структурировать гипотезу «ошибка исполнения vs ошибка инструкции».
- Handoff: всегда в `skill-governor`.

**`skill-governor`**
- Mission: единственный владелец изменения skills/routing/`verify:skills` allowlist.
- Sources: pack `SKILL_GOVERNOR.md` адаптировать под репо (сигналы из MASTER_ADAPTER).
- Validation: после правок skills — `npm run verify:skills`; не создавать параллельную систему.
- Out of Scope: продуктовый feature-код.

- [ ] Создать 2 SKILL.md.
- [ ] **Промежуточный check всех 16:**

Run:

```bash
for s in team-orchestrator final-reviewer product-agent architect-agent backend-engineer frontend-engineer product-designer qa-engineer test-automation-engineer security-engineer devops-sre release-manager documentation-agent research-agent skill-governor feedback-analyzer; do
  test -f "skills/$s/SKILL.md" || echo MISSING "$s"
done
```

Expected: пустой вывод.

---

### Task 7: Routing bootstrap + skills README (GREEN verify)

**Files:**
- Modify: `AGENTS.md`, `CLAUDE.md`, `README.md`, `skills/README.md`
- Modify: уже изменённый `scripts/verify-skills-bootstrap.mjs` (если нужно добить snippets)

- [ ] **Step 1: В `skills/README.md` добавить секцию после Layer 2:**

```markdown
## Layer 3 — Role agents

Ролевые владельцы зон AI Collector. Process/product skills (Layer 0–2) вызываются **внутри** role workflow.

| Skill | Когда |
|-------|-------|
| `team-orchestrator` | 2+ ownership-зоны или неясный владелец |
| `product-agent` | scope, backlog wording, journeys |
| `architect-agent` | ADR, границы модулей, API contracts |
| `backend-engineer` | `src/**` API/domain/jobs |
| `frontend-engineer` | кабинет/статика UI |
| `product-designer` | оркестрация UX/craft |
| `qa-engineer` / `test-automation-engineer` | проверка / Vitest |
| `security-engineer` | auth, secrets, compliance rules |
| `devops-sre` / `release-manager` | CI/envs / cut criteria |
| `documentation-agent` / `research-agent` | docs / research |
| `final-reviewer` | gate перед «готово»/merge claim |
| `feedback-analyzer` → `skill-governor` | улучшение skills |

Контекст команды: [`docs/agents/PROJECT_AGENT_CONTEXT.md`](../docs/agents/PROJECT_AGENT_CONTEXT.md).
```

- [ ] **Step 2: В `AGENTS.md` Default skill routing добавить пункты (сохранить Benjamin-Plus inject нетронутым):**

```markdown
- Multi-zone or unclear owner: use `skills/team-orchestrator/SKILL.md`.
- Auth, secrets, BYOK, or compliance rule changes: use `skills/security-engineer/SKILL.md` before code.
- CI, Docker, Pages, deploy/rollback: use `skills/devops-sre/SKILL.md`.
- Repeated agent mistakes or skill/routing fixes: use `skills/skill-governor/SKILL.md` (signals via `skills/feedback-analyzer/SKILL.md`).
- Shared agent SoT: `docs/agents/PROJECT_AGENT_CONTEXT.md` and `docs/agents/AGENT_WORK_CONTRACT.md`.
```

- [ ] **Step 3: В `CLAUDE.md` одной строкой указать, что role routing живёт в `AGENTS.md` Layer 3 / `docs/agents/` (канон — AGENTS).**

- [ ] **Step 4: В `README.md` секции Agent bootstrap добавить упоминание Layer 3 и ссылку на `docs/agents/PROJECT_AGENT_CONTEXT.md`.**

- [ ] **Step 5: GREEN**

Run: `npm run verify:skills`  
Expected: exit 0, stdout содержит `Skill bootstrap verification passed.`

- [ ] **Step 6: Simulation self-review** — прочитать `SIMULATION_SCENARIOS.md` и сверить, что каждый шаг указывает существующий skill path; при дыре — поправить skill или scenario в том же проходе, снова `npm run verify:skills`.

---

### Task 8: Verification-before-completion

**Files:** none new

- [ ] Run: `npm run verify:skills` (ещё раз свежий)
- [ ] Confirm all acceptance checkboxes from spec §11 mentally against filesystem
- [ ] Read `skills/verification-before-completion/SKILL.md` and only then claim done
- [ ] Commit **только** если пользователь явно попросил

---

## Spec coverage check

| Spec section | Task |
|---|---|
| §4.1 Governance docs | Task 2 |
| §4.2 16 roles | Tasks 3–6 |
| §5 Ownership | Task 2 OWNERSHIP + roles |
| §6 SKILL каркас | Tasks 3–6 skeleton |
| §6.2 Routing | Task 7 |
| §7 Context | Task 2 |
| §8 Work contract | Task 2 |
| §9 Simulations | Task 2 + Task 7 step 6 |
| §10 Order | Tasks 1→7 |
| §11 Acceptance / verify | Task 1 RED, Task 7 GREEN, Task 8 |

## Placeholder / consistency self-review

- Нет TBD/TODO в шагах.
- Имена 16 skills совпадают в Task 1 allowlist, Tasks 3–6 и README table.
- Snippets Task 1 согласованы с текстом Task 7.
- Commit steps optional per user rule.
