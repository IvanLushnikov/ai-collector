# Agent Bootstrap

For any work in this repository, read `skills/using-superpowers/SKILL.md` before doing anything else.

If there is even a small chance that a skill applies, use it first and follow it exactly.

Skill catalog and layer map: `skills/README.md`.

Default skill routing for this repo:

- Product/UI/UX/frontend work for the AI collector domain — screens, flows, dashboards, tables, forms, statuses, analytics, design-system decisions, UX review, and operator-facing product behavior: use `skills/ru-ai-collector-product-design/SKILL.md` first.
- Before redesigns or “improve UI/UX” work: use `skills/ui-ux-audit/SKILL.md`, then the product design skill.
- SaaS cabinet / tools visual craft (after product skill): use `skills/interface-design/SKILL.md`.
- Marketing / landing visual craft: use `skills/frontend-design/SKILL.md`.
- Explicit UX/design review requests: use `skills/ux-design-review/SKILL.md`.
- Feature work, implementation planning, architecture changes, or unclear scope: use `skills/brainstorming/SKILL.md` first.
- Bug fixing, failing tests, flaky behavior, or unknown regressions: use `skills/systematic-debugging/SKILL.md` first.
- Work driven by an agreed plan or backlog item: use `skills/executing-plans/SKILL.md`.
- New behavior or refactors that should be test-led: use `skills/test-driven-development/SKILL.md`.
- Before finishing any non-trivial task: use `skills/verification-before-completion/SKILL.md`.
- When the task should be decomposed across workers: use `skills/dispatching-parallel-agents/SKILL.md` or `skills/subagent-driven-development/SKILL.md`.
- When asked for review feedback: use `skills/receiving-code-review/SKILL.md`.
- When preparing a review request: use `skills/requesting-code-review/SKILL.md`.
- When the work requires a written plan artifact: use `skills/writing-plans/SKILL.md`.
- When creating or editing user-visible Russian text (UI, forms, buttons, errors, notifications, onboarding, empty states, presentations, demos, mockups): use `skills/russian-product-copy/SKILL.md` after `skills/ru-ai-collector-product-design/SKILL.md` whenever the text belongs to the AI collector product.
- When synthesizing a Russian PRD from already-known context without an interview: use `skills/prd-from-context/SKILL.md`.
- Multi-zone or unclear owner: use `skills/team-orchestrator/SKILL.md`.
- Auth, secrets, BYOK, or compliance rule changes: use `skills/security-engineer/SKILL.md` before code.
- CI, Docker, Pages, deploy/rollback: use `skills/devops-sre/SKILL.md`.
- Repeated agent mistakes or skill/routing fixes: use `skills/skill-governor/SKILL.md` (signals via `skills/feedback-analyzer/SKILL.md`).
- Shared agent SoT: `docs/agents/PROJECT_AGENT_CONTEXT.md` and `docs/agents/AGENT_WORK_CONTRACT.md`.

Project-specific rules:

- Treat `CODEX_SPARK_5_3_GOAL.md` as the delivery contract for normal project work.
- Follow `TECH_BACKLOG_1SP.md` and complete at most one `1 SP` task per iteration unless the human explicitly asks for more.
- Update the backlog after implementation when the task changes project state.
