# Cabinet Ops — Iteration Log

## Текущее состояние волны

- Дата: 2026-08-20
- Последняя закрытая: OP-T-009
- Следующая кандидат: OP-D-012 / OP-T-010
- Инварианты: + blockKind permanent/temporary/campaign_pause; OP-T-011 blocked.

## Проходы

## 2026-08-20 — OP-T-007 — done

### Взял
- OP-T-007: типы suppression/block + reasonText RU + additive `blockKind`.

### Сделал
- `src/domain/compliance-block-kind`: mapping `SUPPRESSION_BLOCK`→permanent, окно/частота→temporary; `campaign_pause` для ops (не suppression row).
- RU `reasonText` в suppression/call-window/frequency rules.
- API: compliance check/decisions, calls journal, review-items, `CAMPAIGN_JOB_BLOCKED` — поле `blockKind`.
- docs/compliance-api.md + rulebook note; light UI label в prototype.
- tests/compliance/block-kind + обновлены контрактные тесты.

### Проверка
- vitest tests/compliance + tests/calls/calls-journal-row.contract.test.ts

### Handoff
- Следующие: OP-D-009 (UI mapping исключений), OP-T-008.

## 2026-08-20 — OP-T-009 — done

### Взял
- OP-T-009: фильтр журнала по группам блокировки / статусы / решения.

### Сделал
- `actionGroup` query на tenant/campaign audit-logs (`block|campaign_status|decision`, alias `blocks|review`).
- Группы action в `src/domain/audit-log/action-groups.ts`; док в `docs/audit-logs-api.md`.
- Prototype `#auditKindFilter` → API `actionGroup` в live-режиме; sync `public/prototype.html`.

### Проверка
- vitest domain-audit-log-action-groups + campaign-audit-log.api + prototype-audit-api-trail

### Handoff
- Следующие: OP-D-012 / OP-T-007.

## 2026-08-20 — OP-T-010 — done

### Взял
- OP-T-010: actorType в audit metadata для status_updated / auto_paused / safe_resumed.

### Сделал
- Audit writers: `metadata.actorType` (`user`|`system`) + optional `actorRole` для user-действий.
- Auto-pause → `actorType: system`.
- docs/audit-logs-api.md: раздел Metadata actor type.
- prototype `formatActorLabel` / `mapApiAuditItem` используют `actorType`.

### Проверка
- vitest campaigns.audit-actor-type + campaign-auto-pause + prototype-audit-actor-type

### Handoff
- Следующие: OP-T-007 / OP-D-009, затем остальные todo без блокеров.

## 2026-08-20 — OP-T-006 — done

### Взял
- OP-T-006: pause-before-edit для running/auto_paused.

### Сделал
- Script create: 409 SCRIPT_VERSION_LOCKED также на auto_paused.
- UI: notices + disable scenario/phone controls; toast на save.
- docs/campaigns-api.md раздел Pause-before-edit.

### Проверка
- vitest scripts.api + prototype-pause-before-edit

### Handoff
- Следующие: OP-T-007 / OP-D-009, затем остальные todo без блокеров.

## 2026-08-20 — review-fixes — done

### Взял
- Закрытие дыр ревью волны: audit previous/next в UI, force-doc honesty, sync prototype.

### Сделал
- `mapApiAuditItem` прокидывает `metadata` / `previousValue` / `nextValue` / `reasonText`.
- `docs/campaigns-api.md`: force без обещания worker interrupt; follow-up `OP-T-012` + design `OP-D-014`.
- OP-T-002 parent → `done`; OP-D-008/OP-T-005 помечены блокером IA.
- `prototype.html` = `public/prototype.html`; тест hash equality.

### Проверка
- vitest prototype-audit-api-trail + campaigns-stop-mode-docs (+ related)

### Состояние бэклога
- Следующая свободная `todo` сверху: **OP-T-006** (или OP-T-009), не 008/005.

### Handoff
- Не брать Force UI до OP-T-012.
- Не восстанавливать `#reviewQueue` без product confirm.

## 2026-08-20 — OP-D-007 — done

### Взял
- OP-D-007: бейджи live/демо и тип паузы.

### Сделал
- Системная пауза: `tag stop` + banner `notice danger`; ручная: `tag warn`.
- Шапка кампании: `#campaignModeBadge` (live/демо); журнал: бейдж на строке + блок источника.
- Список кампаний: режим демо на известных локальных строках; API mode sandbox/live → бейдж.

### Проверка
- vitest mode-pause-badges + campaigns-list + home-risk + header + calls-journal — 10 PASS

### Состояние бэклога
- Следующая `todo`: OP-D-008

### Handoff
- **OP-D-008**: empty state очереди проверок.

## 2026-08-20 — OP-T-004 — done

### Взял
- OP-T-004: контракт строки журнала звонков под три колонки UI.

### Сделал
- List: additive `complianceDecision{decision,reasonCode,reasonText,checkedAt}` (+ сохранён `complianceStatus`).
- Detail: тот же summary `complianceDecision` (latest by checkedAt); полный массив без изменений.
- `docs/calls-api.md` — таблица колонок UI ↔ поля.
- Prototype `mapApiCallItem` / drawer предпочитают API-объект.
- Тест `calls-journal-row.contract.test.ts`.

### Проверка
- vitest journal-row + call-details + sandbox-call + prototype calls — 50 PASS

### Состояние бэклога
- Следующая `todo`: OP-D-007

### Handoff
- **OP-D-007**: бейджи режима и типа паузы.

## 2026-08-20 — OP-D-006 — done

### Взял
- OP-D-006: журнал звонков — статус попытки | исход | решение+причина.

### Сделал
- Таблица: Время · Должник · Статус попытки · Исход разговора · Решение (+ причина вторым уровнем).
- Фильтр «Исход разговора»; expand colspan=5.
- Drawer: блок «Статус попытки · исход · решение» с теми же осями.
- `prototype.html` + `public/prototype.html`; тесты journal/call-card.

### Проверка
- vitest `prototype-calls-journal` + `prototype-call-card` — 5 PASS

### Состояние бэклога
- Следующая `todo`: OP-T-004

### Handoff
- **OP-T-004**: контракт строки журнала звонков (list/detail) под три колонки UI.

## 2026-08-20 — OP-T-003 — done

### Взял
- OP-T-003: audit previous/next value.

### Сделал
- `campaign.status_updated` и `campaign.safe_resumed`: metadata.previousValue / nextValue / reason (additive).
- `docs/audit-logs-api.md` обновлён.
- Тест `campaigns.audit-previous-next.test.ts`.

### Проверка
- vitest audit-previous-next + stop-mode + campaigns.create — 66 PASS

### Состояние бэклога
- Следующая `todo`: OP-D-006

### Handoff
- **OP-D-006**: журнал звонков — две оси статуса; зависит от OP-T-004 для полного контракта.

## 2026-08-20 — OP-D-005 — done

### Взял
- OP-D-005: журнал как decision trail.

### Сделал
- Колонки: Время · Кто · Событие · Объект · Было → стало · Почему; technical id вторым уровнем.
- Фильтр «Тип записи»: решения / статусы / блокировки.
- Empty: «Пока нет зафиксированных действий.»
- Убран IP из первой линии.

### Проверка
- vitest prototype-review-queue / nav — PASS

### Состояние бэклога
- Следующая `todo` в очереди: OP-D-006 (после OP-T-003 в таблице… check queue order)

### Handoff
- Следующий ID: **OP-T-003** (audit previous/next value).

## 2026-08-20 — OP-T-002b — done

### Взял
- OP-T-002b: stopMode + audit.

### Сделал
- PATCH status: stopMode graceful|force; default graceful; audit metadata; complianceBypass=false.
- Прототип шлёт stopMode graceful.
- Docs + tests.

### Проверка
- vitest stop-mode / docs / stop-confirm — PASS

### Состояние бэклога
- Следующая `todo`: OP-D-005

### Handoff
- **OP-D-005**: журнал decision trail.

## 2026-08-20 — OP-T-002a — done

### Взял
- OP-T-002a: документ graceful vs force stop.

### Сделал
- Раздел в `docs/campaigns-api.md`: graceful/force, канон `completed`, no compliance bypass, UI Force deferred.
- Тест `tests/campaigns-stop-mode-docs.test.ts`.

### Проверка
- vitest docs test — PASS

### Состояние бэклога
- Следующая `todo`: OP-T-002b

### Handoff
- **OP-T-002b**: реализовать `stopMode` + audit по документу; не вводить `stopped`.

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
