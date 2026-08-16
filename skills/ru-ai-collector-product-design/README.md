# ru-ai-collector-product-design

Codex skill для проектирования и реализации интерфейса compliance-first B2B SaaS платформы AI-взыскания.

## Что внутри

- `SKILL.md` — основные правила продукта, UX/UI и реализации.
- `references/domain-model.md` — разграничение кампании, должника, compliance decision, звонка, разговора, outcome и audit.
- `references/compliance-first-ux.md` — UX решений, блокировок, review, auto-pause, stop conditions и evidence.
- `references/ru-interface-copy.md` — правила русских интерфейсных текстов.
- `references/screen-patterns.md` — рекомендуемые MVP-экраны при отсутствии существующего интерфейса.
- `references/review-checklist.md` — финальная проверка перед сдачей интерфейсной задачи.

## Основная идея

Skill специально не содержит конкретных юридических лимитов и правил взыскания. Такие правила должны приходить из утвержденной продуктовой/legal документации или backend compliance engine, а не из дизайнерского skill.

## Рекомендуемый стек

Этот skill используется первым как продуктовый контекст. При наличии дополнительных skills можно подключать:

1. `design-systems`
2. `ui-ux-pro-max`
3. `ux-writing`
4. `data-visualization`
5. `design-review` / `refactoring-ui`
6. `i18n-check`
