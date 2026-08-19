---
name: russian-product-copy
description: "Use when creating or editing any user-visible Russian text — UI screens, buttons, forms, errors, notifications, onboarding, empty states, settings, product presentations, demos, mockups, HTML prototypes, or agent-generated copy. Applies to prototype.html, index.html, API user messages, and validation errors shown to operators."
---

# Russian Product Copy

## When to invoke

Invoke **before** writing or changing visible Russian text — not only when the user asks for copy help.

Typical triggers:

- new or changed UI screen, form, modal, wizard step;
- button, heading, hint, toast, notification;
- error or empty state;
- onboarding, settings, report labels;
- product presentation, demo, mockup;
- user-facing validation or import feedback.

Read [PRODUCT_LANGUAGE.md](../../PRODUCT_LANGUAGE.md) first and follow its terminology table.

## Core principle

The interface speaks the user's language, not the developer's.

The user must not understand system architecture, AI jargon, DevOps, frontend/backend splits, internal service names, API names, or technical entity names to complete their task.

Distinguish:

- **Internal term** — code, API, logs, schemas (`Campaign`, `ComplianceDecision`, `VALIDATION_ERROR`);
- **User term** — what appears in the cabinet (`кампания`, `проверка ограничений`, `не удалось сохранить кампанию`).

Do not rename code entities only for UX. Map them in copy and in `PRODUCT_LANGUAGE.md`.

## Language rules

### Default Russian

Use natural modern Russian. Prefer a familiar Russian phrase over an anglicism when one exists:

| Avoid in UI | Prefer |
|---|---|
| deploy | опубликовать / запустить |
| workflow | процесс / сценарий |
| permissions | доступ / разрешения |
| credentials | данные для подключения |
| trigger | условие запуска |
| feature | функция / возможность |
| submit | отправить / сохранить |
| handoff | перевод оператору |
| PTP (alone) | обещание платежа |
| compliance (alone) | проверка ограничений / ограничения |
| suppression | список исключений / исключения |
| tenant | организация / аккаунт клиента |

Do not translate mechanically. Pick the term that fits the screen.

### Allowed common words

Keep widely understood words: сайт, файл, чат, email, приложение, номер, отчёт.

Technical terms like API, webhook, SIP are allowed only in integration/admin screens for technical users, and only when the meaning would be lost without them.

### Product name

In user-facing surfaces, use **ИИ-коллектор** (see `prototype.html`).  
`index.html` is an internal decision dashboard; mixed RU/EN there is acceptable for stakeholders, but new user-cabinet copy must stay consistent with `PRODUCT_LANGUAGE.md`.

## Component rules

### Buttons

Answer: «Что сейчас произойдёт?»

Prefer: Создать кампанию, Сохранить, Подключить, Отправить, Запустить кампанию, Выгрузить отчёт, Поставить на паузу.

Avoid abstract labels: ОК, Выполнить, Submit, Подтвердить — when a concrete action exists.

### Errors

Explain when possible:

1. What failed.
2. Why (if known and helpful).
3. What to do next.

Bad: `Validation error`, `Missing required columns: timezone`

Good: `Не удалось загрузить базу. Добавьте столбцы: часовой пояс, сумма долга, статус долга, статус согласия.`

Never expose stack traces, raw HTTP codes, or internal exception names in user UI.

API may keep machine-readable `error` codes; pair them with a Russian `message` when the response is shown to people.

### Headings

State the screen purpose or action quickly. Avoid marketing slogans inside working screens.

### Hints

Do not explain obvious controls. If a long instruction is needed for a simple action, prefer improving the layout first.

### Empty states

Say what will appear here, why it matters, and the first step.

### Dangerous actions

Describe consequences explicitly. Do not rely on «Вы уверены?» alone.

### Tone

Calm, clear, human, professional. No slang, forced humor, or hype.

### Public landing (`public/index.html`)

GitHub Pages landing sells **ИИ-коллектор** as a product, not security or compliance as a standalone offer.

**Primary message:** automation of collection campaigns — base, scenario, outbound calls, outcomes.

**Secondary message:** control is built into the process (restriction checks, operator handoff, action log). Do not lead with safety slogans.

| Avoid as hero headline | Prefer |
|---|---|
| Звонки только там, где это разрешено | ИИ-коллектор для телефонного взыскания |
| Безопасный обзвон / контур безопасности | Автоматизация кампаний взыскания |
| «Что покажем на демо» as a separate hero block | Inline demo form in hero (`#demo-form`) |

**Layout pattern (B2B SaaS):**

- Hero: two columns — product copy left, compact demo form right.
- Value strip below hero: 3 equal cards (campaigns, dialogues/outcomes, in-process control).
- No orphan side panel that breaks the grid; no modal-only demo form on desktop.
- Sticky bottom CTA — mobile only.

**Tone for landing:** businesslike, slightly lively; short sentences; no prototype jargon, no hype, no bureaucratic Russian.

When editing landing copy, read [PRODUCT_LANGUAGE.md](../../PRODUCT_LANGUAGE.md) and align with [ru-ai-collector-product-design](../ru-ai-collector-product-design/SKILL.md) for layout decisions.

### Bureaucratic Russian

Avoid: осуществить, произвести, имеется, является, в рамках, посредством, данный, вышеуказанный, необходимо выполнить.

Use short verbs: создать, проверить, загрузить, сохранить, запустить.

## Workflow

When adding or editing user-visible text:

1. Read `PRODUCT_LANGUAGE.md`.
2. Use approved user terms; do not introduce synonyms for the same entity on one screen.
3. Write copy before or together with markup — not as an afterthought.
4. Scan for anglicisms, internal jargon, vague buttons, and errors without next steps.
5. If a term is ambiguous, add a row to `PRODUCT_LANGUAGE.md` instead of guessing.

## Audit mode

When asked to review existing copy (or after introducing this skill to a touched area):

- list anglicisms, jargon, inconsistent entity names, vague buttons, bureaucratic phrasing, errors without actions;
- fix only small, uncontroversial issues in the same change;
- record disputed renames as recommendations, not drive-by refactors.

## References

- Product terminology: [PRODUCT_LANGUAGE.md](../../PRODUCT_LANGUAGE.md)
- User cabinet tone reference: [prototype.html](../../prototype.html)
- Product/domain context: [ROADMAP_B2B_SAAS.md](../../ROADMAP_B2B_SAAS.md)
