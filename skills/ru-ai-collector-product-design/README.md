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

Этот skill используется первым как продуктовый контекст. Рекомендуемый стек craft/review skills в репозитории:

1. `ui-ux-audit` — аудит текущего состояния до изменений
2. `interface-design` — craft кабинета / SaaS tools (не маркетинг)
3. `frontend-design` — craft лендинга / маркетинговых поверхностей
4. `russian-product-copy` — русские пользовательские тексты
5. `laws-of-ux` + `accessibility` — эвристики и a11y
6. `ux-design-review` — оркестрация финального UX/design review

Не подключай marketplace `ui-ux-pro-max` по умолчанию: каталог стилей часто тянет к generic AI-эстетике и конфликтует с compliance-first плотностью кабинета.
