# Claude Bootstrap

Before any response or repo action, read `AGENTS.md` and then `skills/using-superpowers/SKILL.md`.

This repository expects skill-first behavior. Do not explore files, ask clarifying questions, plan, or edit code until the relevant Superpowers skill has been selected and read.

Default routing should stay aligned with `AGENTS.md`, especially for these cases:

- Product/UI/UX/frontend work for the AI collector domain — screens, flows, dashboards, tables, forms, statuses, analytics, design-system decisions, UX review, and operator-facing product behavior: use `skills/ru-ai-collector-product-design/SKILL.md` first.
- Before redesigns or “improve UI/UX” work: use `skills/ui-ux-audit/SKILL.md`, then the product design skill.
- When creating or editing user-visible Russian text for the AI collector product: use `skills/russian-product-copy/SKILL.md` after `skills/ru-ai-collector-product-design/SKILL.md`.
- Explicit UX/design review: use `skills/ux-design-review/SKILL.md`.

Non-optional operating rules:

- Treat `AGENTS.md` as the canonical routing table for development, product design, requirements work, UX reviews, backend implementation, and bug fixing in this repo.
- Role routing lives in the role routing bullets in `AGENTS.md`, the Layer 3 section of `skills/README.md`, and `docs/agents/`; `AGENTS.md` remains canonical.
- If there is any doubt whether a skill applies, invoke the heavier process skill first instead of skipping the skill workflow.
- Do not begin implementation before the required process skill has been selected and read.
- Do not finish a non-trivial task without reading `skills/verification-before-completion/SKILL.md` and running fresh verification.
