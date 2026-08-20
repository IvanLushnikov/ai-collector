# Skills catalog (AI Collector)

Агенты обязаны читать `using-superpowers` через `AGENTS.md` до любой работы.  
Этот файл — карта слоёв: **что брать** и **в каком порядке**.

Подробный ресерч: [`docs/skills/research-lobehub-superpowers-2026-08-20.md`](../docs/skills/research-lobehub-superpowers-2026-08-20.md).

## Layer 0 — Process (obra/superpowers)

Источник: https://github.com/obra/superpowers (pin в `third_party/superpowers/`).

| Skill | Когда |
|-------|-------|
| `using-superpowers` | Старт любой сессии |
| `brainstorming` | Любая креативная/feature работа до кода |
| `writing-plans` | Нужен письменный план |
| `executing-plans` / `subagent-driven-development` | Исполнение плана |
| `dispatching-parallel-agents` | 2+ независимых подзадачи |
| `test-driven-development` | Новое поведение / рефактор с тестами |
| `systematic-debugging` | Баги, флаки, регрессии |
| `verification-before-completion` | Перед «готово» |
| `requesting-code-review` / `receiving-code-review` | Code review цикл |
| `using-git-worktrees` / `finishing-a-development-branch` | Изоляция ветки / завершение |
| `writing-skills` | Создание/правка skills |

## Layer 1 — Product (локальные, высший приоритет для UI)

| Skill | Когда |
|-------|-------|
| `ru-ai-collector-product-design` | Экраны, потоки, статусы, compliance UX, UX review продукта |
| `russian-product-copy` | Любой пользовательский русский текст (+ `PRODUCT_LANGUAGE.md`) |

## Layer 2 — Craft / audit (curated LobeHub + локальные адаптеры)

| Skill | Когда |
|-------|-------|
| `ui-ux-audit` | До редизайна / «улучшить UI» — сначала текущее состояние |
| `interface-design` | Craft кабинета/SaaS tools **после** product skill |
| `frontend-design` | Craft лендинга/маркетинга; в кабинете только точечный polish |
| `laws-of-ux` | Эвристический взгляд на UX |
| `accessibility` | WCAG / keyboard / a11y audit |
| `ux-design-review` | Финальный UX/design review (оркестратор) |
| `prd-from-context` | Собрать RU PRD из уже известного контекста |

Внешние skills содержат `SOURCE.md`. Не обновляйте их молча без записи в `third_party/lobehub/manifest.json`.

## Default routing recipes

**Новый экран кабинета**

`brainstorming` → `ui-ux-audit` → `ru-ai-collector-product-design` → `russian-product-copy` → `interface-design` → TDD/implementation → `ux-design-review` → `verification-before-completion`

**Лендинг / marketing HTML**

`brainstorming` → `ui-ux-audit` → `frontend-design` → `russian-product-copy` (если RU) → `accessibility` → `ux-design-review`

**Баг в UI/API**

`systematic-debugging` → (если UI) product/copy skills → fix → `verification-before-completion`

**Code review**

`requesting-code-review` / `receiving-code-review` (Superpowers). Для UI дополнительно `ux-design-review`.

## Do not install by default

- `ui-ux-pro-max` и его форки
- Параллельные LobeHub `code-review` skills
- Generic KPI `dashboard-design` packs
- Тяжёлые gstack design-review bundles

## Verification

```bash
npm run verify:skills
```

Скрипт проверяет наличие обязательных `SKILL.md` и сниппетов маршрутизации в `AGENTS.md` / `CLAUDE.md` / `README.md`.
