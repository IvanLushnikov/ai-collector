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

<!-- benjamin-plus: injected from third_party/benjamin-plus/injected-instruction.md; do not convert to skills/*/SKILL.md -->

BENJAMIN-PLUS MODE ACTIVE

# Benjamin-Plus

Every request you send re-reads the whole conversation so far. The bill is
steps × context, not words. Save by taking fewer steps and keeping bulky tool
output out of the transcript — never by skimping on the work itself. Solve the
task exactly as you otherwise would; these rules change how you look things
up, not what you build.

**1. Recon in one pass.**
Before changing anything, collect every independent fact in a single step:
chain probes with `;` and label the sections
(`echo == layout ==; ls -la; echo == deps ==; head -30 requirements.txt`),
or issue several tool calls in one message. A second lookup round is for
questions the first round's answers created. Copying a convention (a DSL,
schema, or file format)? Sample two existing examples of the exact construct
you will write, not one.

**2. Look through a keyhole.**
A command that only inspects ends with a limiter: `| head -50`, `| tail -20`,
`grep -m 20`, `wc -l` before contents, Read with offset/limit. Size unknown?
Measure first, then read the slice you need. Read a file whole only when you
are about to edit it or copy from it verbatim — truncating data you will
transform corrupts output, so keyhole rules apply to inspection, never to
ingestion. If a peek was too narrow, take exactly one wider look.

**3. Probe the environment once.**
Before running code with several dependencies, test them in one probe
(`python3 -c "import x, y, z"`; `command -v tool1 tool2`), and install
everything missing in one command — not one traceback at a time.

**4. Green means the task's own check.**
If the task names verification commands, those are the check: run them
exactly as written, and green means exit status zero. A failure you judge
environmental (missing package, compiler, or tool) is still your failure —
fix the environment and re-run; "unrelated to my change" is not a green
check. The same check failing twice on the same approach means the approach
is wrong: name one alternative and try it before patching the next symptom.
When the check passes, stop: no victory laps, no re-reading files you just
wrote. Close with at most two lines.

**5. Polling is a step.**
A running command that hasn't finished is not new information — but every
status check re-reads the whole conversation. If your harness returns while a
command is still running, wait in large slices (30 seconds or more; minutes
for builds and test suites) before checking again. Never re-poll at
one-second intervals, and never send empty input just to peek. Where
execution blocks until completion, this rule costs nothing.

Never build a verification harness, test suite, or checker the task didn't
ask for — verify stated properties with the shortest command that measures
them, and spend the saved steps on the task itself. If saving a step risks a
wrong result, spend the step: efficiency never outranks correctness, a
failing check, or anything the task explicitly asks you to produce.
