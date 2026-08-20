# Skills packaging research — LobeHub + Superpowers

Дата: 2026-08-20  
Репозиторий: `IvanLushnikov/ai-collector`  
Источники: [lobehub.com/skills](https://lobehub.com/skills), [obra/superpowers](https://github.com/obra/superpowers)

## Вердикт

Для этой репы нужен **трёхслойный** набор, а не «скачать топ-100 с маркетплейса»:

1. **Process** — весь `obra/superpowers` (уже был в `skills/`).
2. **Product** — локальные `ru-ai-collector-product-design` + `russian-product-copy` + `PRODUCT_LANGUAGE.md` (это главный moat; в LobeHub почти нет качественного RU UX для B2B взыскания).
3. **Craft / review** — узкий curated набор с LobeHub (вендорится в `skills/` с `SOURCE.md`), плюс оркестратор `ux-design-review`.

Польза появляется только если skills **маршрутизируются** из `AGENTS.md`, проверяются `npm run verify:skills` и не конкурируют друг с другом.

## Что уже было в репе

| Слой | Skills |
|------|--------|
| Superpowers | `using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `writing-skills` |
| Product | `ru-ai-collector-product-design`, `russian-product-copy` |
| Meta | `third_party/superpowers` (пин upstream), `docs/superpowers/{specs,plans}` |

`obra/superpowers` **добавлять заново не нужно** — нужен аккуратный pin + явная роль «процесс разработки». Дублирующие code-review skills с LobeHub брать не стоит.

## Как искали на LobeHub

Через `@lobehub/market-cli skills search` по запросам: `ux design`, `ui design frontend`, `code review`, `design review`, `russian`, `копирайтинг`, `accessibility`, `user flow`, `dashboard`, `ux writing`, `ui-ux-pro-max`.

Ключевые наблюдения:

- Много **форков одного и того же** skill (`ui-ux-pro-max`, `frontend-design`). Брать канонический/самый полный оригинал, не форк с большими stars чужого монорепо.
- По **русскому UX/copy** маркетплейс почти пустой. Единственный релевантный RU-артефакт из просмотренных — `prd-from-context`. Интерфейсный русский должен оставаться локальным skill + словарём.
- `ui-ux-pro-max` (650+ installs у nextlevelbuilder) — большой каталог стилей; для compliance cabinet рискован: тянет к «красивому SaaS» и AI-slop палитрам.
- `gstack` design-review мощный, но тяжёлый и завязан на свой tooling — в репу не вендорить целиком.
- Generic `dashboard-design` с KPI-карточками **конфликтует** с правилом продукта «риск важнее vanity KPI».

## Что брать и почему

### Обязательно (уже / зафиксировано)

| Skill | Почему |
|-------|--------|
| Весь Superpowers | Единый process: brainstorm → plan → TDD → review → verify. Это «как работать», не «как нарисовать кнопку». |
| `ru-ai-collector-product-design` | Доменный UX compliance-first B2B. Без него craft-skills рисуют чужой продукт. |
| `russian-product-copy` | Единственный надёжный контур русского UI; маркетплейс не закрывает. |

### Добавить (curated LobeHub → `skills/`)

| Skill | Identifier | Зачем |
|-------|------------|-------|
| `frontend-design` | `anthropics-claude-code-frontend-design` | Анти-slop визуальный craft для лендинга/`public/` |
| `interface-design` | `dammyjay93-interface-design-interface-design` | Craft кабинета/SaaS tools; явно отделяет marketing от product UI |
| `ui-ux-audit` | адаптирован из `nicepkg-ai-workflow-ui-ux-audit` | Audit-before-implement под пути этой репы |
| `laws-of-ux` | `mollymillions-code-sayan-claude-skills-laws-of-ux` | Эвристики для review (Jakob, Hick, Fitts, …) |
| `accessibility` | `davila7-claude-code-templates-accessibility` | WCAG для HTML cabinet/landing (EN, MIT) |
| `prd-from-context` | `madteacher-skills-prd-from-context` | Быстрый RU PRD из уже собранного контекста |
| `ux-design-review` | локальный оркестратор | Связывает product checklist + laws + a11y + copy |

Дополнительно: английские UX-writing паттерны из `elie222-inbox-zero-ux-writing` лежат как reference у `russian-product-copy`, **не** как отдельный primary skill.

### Не брать (осознанно)

| Кандидат | Почему нет |
|----------|------------|
| Любой `ui-ux-pro-max` | Стилевой суп, дубли, риск AI-эстетики |
| `garrytan-gstack-*-design-review` | Слишком тяжёлый / coupled |
| LobeHub `code-review` форки (`secondsky`, ecc, …) | Дублируют Superpowers receiving/requesting |
| Generic `dashboard-design` KPI packs | Конфликт с compliance-first иерархией |
| `wireframe-prototyping` | Слабый ROI при уже кликабельном `prototype.html` |
| ECC accessibility на японском | Плохой fit для RU-команды и HTML-кабинета |
| Десятки форков `frontend-design` | Один Anthropic/ECC оригинал достаточно |

## Как упаковать, чтобы была польза

### Принципы

1. **Плоский каталог** `skills/<name>/SKILL.md` — агенты реально находят skills.
2. **Один канонический router** — `AGENTS.md` (и зеркало `CLAUDE.md`).
3. **Относительные пути** `skills/.../SKILL.md` — работают и локально, и в Cloud Agent.
4. **Слои в README**, не вложенные папки `_vendor/` (вложенность ломает discovery).
5. **Каждый внешний skill** имеет `SOURCE.md` (identifier, upstream, дата, роль).
6. **Product всегда выше craft** — красивый UI не может перебить compliance/термины.
7. **`npm run verify:skills`** валидирует наличие обязательных skills и сниппетов router-а.
8. Specs/plans Superpowers остаются в `docs/superpowers/` — это артефакты процесса, не skills.

### Рекомендуемый порядок на задаче

```text
using-superpowers
  → brainstorming / systematic-debugging / writing-plans (по типу задачи)
  → ui-ux-audit (если меняем UI)
  → ru-ai-collector-product-design
  → russian-product-copy (если есть видимый RU текст)
  → interface-design XOR frontend-design
  → accessibility / laws-of-ux по необходимости
  → реализация + TDD
  → ux-design-review + requesting-code-review
  → verification-before-completion
```

### Анти-паттерн упаковки

- Складывать 30 marketplace skills «на всякий случай» — агент будет выбирать случайно и игнорировать product skill.
- Держать абсолютные пути `/Users/...` в bootstrap — ломает Cloud/CI/других разработчиков.
- Ставить `ui-ux-pro-max` рядом с product skill без приоритета — получится красивый, но опасный кабинет.

## Итог для команды

Берём **Superpowers целиком как процесс**, **два локальных product skills как истину продукта**, и **6–7 curated craft/review skills** с LobeHub. Остальное — шум.

Каталог для агентов: [`skills/README.md`](../../skills/README.md).  
Манифест внешних pin-ов: [`third_party/lobehub/manifest.json`](../../third_party/lobehub/manifest.json).
