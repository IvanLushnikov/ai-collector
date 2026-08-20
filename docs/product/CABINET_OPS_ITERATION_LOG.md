# Cabinet Ops — Iteration Log

## Текущее состояние волны

- Дата: 2026-08-20
- Последняя закрытая: OP-T-002 (`split`)
- Следующая кандидат: OP-T-002a
- Риски/договорённости: Force UI ждёт OP-T-002b; канон статуса остановки = `completed`, не `stopped`.
- Инварианты: OP-D-001…004, OP-T-001; OP-T-002 разрезан на 002a (док) / 002b (код).

## Проходы

## 2026-08-20 — OP-T-002 — split

### Взял
- OP-T-002: Graceful stop vs force stop.

### Контекст
- DoD допускает split, если enum/поведение не готовы; канон = `completed`, не `stopped`.
- Полная реализация force (прерывание активных попыток) + audit + совместимость со state machine > 1 SP.

### Сделал
- Статус OP-T-002 → `split` → `OP-T-002a` (документ), `OP-T-002b` (реализация stopMode+audit).
- Код не менял в этом проходе (правило: не реализовывать куски в том же проходе, что split).

### Проверка
- Бэклог содержит 002a/002b со статусом `todo`; очередь обновлена.

### Состояние бэклога
- OP-T-002: `split`
- Следующая `todo`: OP-T-002a

### Handoff
- Следующий ID: **OP-T-002a** (только документация поведения).
- Не трогать UI Force до OP-T-002b.

## 2026-08-20 — OP-D-004 — done

### Взял
- OP-D-004: визуальная машина Pause / Stop / переход (Force — только после OP-T-002).

### Сделал
- Модалки: явные последствия паузы vs завершения; Force не показываем.
- Меню статусов: подписи «приостановить…» / «остановить и завершить».
- UI-состояние `stopping` → бейдж «останавливается…», меню disabled на время PATCH.
- PRODUCT_LANGUAGE не меняли (термины уже есть).

### Проверка
- vitest pause/stop/header/overview — PASS

### Состояние бэклога
- Следующая `todo`: OP-T-002

### Handoff
- **OP-T-002** — graceful vs force stop API; после него можно добавить Force UI.

## 2026-08-20 — OP-D-003 — done

### Взял
- OP-D-003: Обзор — риск выше KPI.

### Контекст
- Баннер автопаузы уже был над KPI; нужно закрепить стек рисков и не красить KPI «ok» при риске.

### Сделал
- `#campaignOverviewRiskStack` над `#campaignOverviewKpis`: автопауза, ручная пауза, очередь проверки, internal closed.
- `setCampaignState` показывает баннеры по статусу; KPI получают `.is-risk` если статус ≠ `running` или виден риск.
- CSS приглушает `.metric.ok` при `.is-risk`.
- Регрессия: текста «риск-событий нет» нет.

### Проверка
- vitest overview + campaign-header — PASS
- Скрин: `op_d_003_overview_risk_above_kpi.webp`

### Состояние бэклога
- Следующая `todo`: OP-D-004

### Handoff
- Следующий ID: **OP-D-004**. Force без OP-T-002 не показывать.

## 2026-08-20 — OP-T-001 — done

### Взял
- OP-T-001: поля списка кампаний для ops-таблицы.

### Контекст из прошлых проходов
- UI уже ждёт Причина/Прогресс/Обновлено; нужны additive API fields.

### Сделал
- `GET /tenants/:tenantId/campaigns`: `updatedAt`, `statusReason` (из audit auto_paused), `progress.attemptedCalls/totalRecords`.
- Документация `docs/campaigns-api.md`.
- Прототип маппит поля в таблицу.
- Тест `tests/campaigns.list-ops-fields.test.ts` + обновлены контракты в `campaigns.create.test.ts`.

### Проверка
- `vitest` list-ops + campaigns.create + prototype list tests — 66/66 PASS

### Состояние бэклога
- OP-D-001, OP-D-002, OP-T-001: `done`
- Следующая `todo`: OP-D-003

### Handoff следующей задаче
- Следующий ID: **OP-D-003** (риск-баннер выше KPI на Обзоре).
- Не ломать additive list fields.

## 2026-08-20 — OP-D-002 — done

### Взял
- OP-D-002: плотная таблица кампаний (колонки как у Mango).

### Контекст из прошлых проходов
- OP-D-001 уже убрал AI-визуал; IA/JS сверх DoD не трогать без нужды.
- До OP-T-001 — честный «н/д», не выдуманные %.

### Сделал
- thead/tbody Главной: Название, Статус, Причина, Режим, Прогресс, Обновлено; min-width 1100px.
- Статика и `loadHomeCampaignsFromApi`: placeholder «н/д» для причины/режима/обновлено; прогресс из report как «Обзвонили N из M» при total>0.
- Нет summary KPI-карточек над таблицей; нет CTA «Открыть причину» (по PRODUCT_LANGUAGE).
- Тесты `prototype-campaigns-list` / `prototype-home-risk` обновлены.
- Синхрон `public/prototype.html`.

### Проверка (команды + результат)
- `npx vitest run tests/prototype-campaigns-list.test.ts tests/prototype-home-risk.test.ts` — 4/4 PASS
- Скрин Главной с новыми колонками: `op_d_002_dense_campaigns_table.webp`

### Состояние бэклога
- OP-D-001, OP-D-002: `done`
- Следующая `todo`: OP-T-001

### Handoff следующей задаче
- Знать: UI уже ждёт поля причины/режима/updated/progress; не ломать колонки.
- Следующий ID: **OP-T-001** (поля списка кампаний в API).
- Не трогать: PRODUCT_LANGUAGE без нужды; не обещать live.

## 2026-08-20 — OP-D-001 — done

### Взял
- OP-D-001: убрать AI-визуал кабинета (glow / gradient-hero / glass).

### Контекст из прошлых проходов
- Бэклог и бенчмарк на `main` (b2efaf3); очередь стартует с OP-D-001.
- Не трогать IA/JS; `PRODUCT_LANGUAGE.md` не менять.

### Сделал
- CSS в `prototype.html` и `public/prototype.html` (синхронизированы):
  - убраны `linear-gradient`, glass, cyan-glow, purple awaiting;
  - нейтральные токены, плоские logo/side-balance/hero/panel/metric/tag/status-pill;
  - `state-awaiting` → amber.
- IA и JS не менял.

### Проверка (команды + результат)
- Asserts: 0× gradient/glow/glass/purple в `<style>`; файлы идентичны — PASS
- HTTP `8765` + скрины Главной и шапки кампании — ops-таблица без AI-лендинга
- Артефакты: `op_d_001_home_campaigns_table.webp`, `op_d_001_campaign_header.webp`

### Состояние бэклога
- OP-D-001: `done`; следующая `todo`: OP-D-002

### Handoff следующей задаче
- Не возвращать gradient/glow.
- Колонки таблицы — OP-D-002; данные причины/% — OP-T-001 (до него «н/д»).
- Следующий ID: OP-D-002

## 2026-08-20 — BOOTSTRAP — `unblocked`

### Взял
- Положить бэклог и бенчмарк на рабочую ветку после стопа агента («нет файла на main»).

### Контекст из прошлых проходов
- Предыдущий автономный проход остановился: файлов не было на `main`.

### Сделал
- `docs/product/CABINET_OPS_BACKLOG_1SP.md` — очередь OP-D-* / OP-T-*
- `docs/product/2026-08-20-operator-cabinets-benchmark.md` — источник паттернов
- Этот журнал создан для handoff между проходами

### Проверка
- Файлы на месте в `docs/product/`
- Первая `todo` в бэклоге: OP-D-001

### Состояние бэклога
- Очередь открыта, статусы задач не менялись

### Handoff следующей задаче
- Стартовать с OP-D-001 (убрать AI-визуал)
- Не трогать IA/JS сверх DoD первой задачи
- Читать этот лог перед каждым проходом
