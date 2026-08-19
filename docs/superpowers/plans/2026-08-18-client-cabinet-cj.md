# Client Cabinet CJ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Пересобрать клиентский кабинет `prototype.html` в один путь менеджера кампаний: создать → база → сценарий → телефония → запустить с Обзора → звонки → аналитика.

**Architecture:** Один HTML-кабинет + инлайн JS. Меню и вкладки подчинены IA из спецификации. Readiness остаётся на Обзоре (не отдельная вкладка). Отчёт кампании заменяется глобальной Аналитикой. Админ-контур речи/сценариев в этой волне не рисуем.

**Tech Stack:** `prototype.html` (статический кабинет), Vitest-тесты `tests/prototype-*.test.ts`, словарь `PRODUCT_LANGUAGE.md`. Backend API не расширять.

## Global Constraints

- Источник истины: `docs/superpowers/specs/2026-08-18-client-cabinet-cj-design.md` (утверждена).
- Skills до кода: `skills/using-superpowers/SKILL.md`, `skills/ru-ai-collector-product-design/SKILL.md`, `skills/russian-product-copy/SKILL.md`, `skills/test-driven-development/SKILL.md`, `skills/verification-before-completion/SKILL.md`.
- Не трогать `index.html`.
- Не расширять enum `CampaignStatus`, не делать живой CRM, не отдавать менеджеру one-click resume после системной паузы, не делать force-call.
- Запрещённые слова в клиентском UI: `compliance`, `QA`, `KPI`, `PTP`, `BYOK`, `ASR`, `TTS`, `LLM`, `sandbox`, `tenant`, `review`, `handoff`. Не писать «провайдер».
- Инлайн-скрипт `prototype.html` должен парситься: `new Function(script)` не бросает. `showCampaignTab` закрывается до init.
- Коммиты только если человек явно попросил.

---

### Task 1: Контракт IA в тестах (red)

**Files:**
- Modify: `tests/prototype-nav.test.ts`
- Modify: `tests/prototype-campaign-views.test.ts`
- Modify: `tests/prototype-home-risk.test.ts`
- Modify: `tests/prototype-campaigns-list.test.ts`
- Modify: `tests/prototype-campaign-header.test.ts`

**Interfaces:**
- Consumes: текущий `prototype.html`
- Produces: падающие тесты на новое меню, вкладки, колонки Главной, отсутствие «Открыть причину»

- [ ] **Step 1: Переписать nav-тест на новое меню**

В `tests/prototype-nav.test.ts` заменить тест сайдбара:

```ts
it('exposes client cabinet menu without admin or duplicate campaign list', () => {
  expect(html).toMatch(/data-screen="home">Главная/);
  expect(html).toMatch(/data-screen="sources">Источники/);
  expect(html).toMatch(/data-screen="telephony">Телефония/);
  expect(html).toMatch(/data-screen="analytics">Аналитика/);
  expect(html).toMatch(/data-screen="auditLog">Журнал действий/);
  expect(html).not.toMatch(/data-screen="campaigns"/);
  expect(html).not.toMatch(/data-screen="speech"/);
  expect(html).not.toMatch(/data-screen="scripts"/);
  expect(html).not.toMatch(/data-screen="reviewQueue"/);
  expect(html).toContain('id="telephony"');
  expect(html).toContain('id="analytics"');
  expect(html).not.toContain('id="speech"');
  expect(html).not.toContain('id="scripts"');
  expect(html).not.toContain('id="reviewQueue"');
});
```

Оставить тесты парсинга скрипта. Тест `renderReviewQueue` после `showCampaignTab` заменить на init, который реально останется (например `renderCallsTable` или `renderAuditLog`) — после реализации скрипта, не ломая парсинг.

- [ ] **Step 2: Вкладки кампании только пять**

В `tests/prototype-campaign-views.test.ts` ожидать:

```ts
expect(tabs).toEqual(['overview', 'base', 'scenario', 'phone', 'calls']);
```

Не ждать `launch`, `review`, `report`, `settings`. Убрать ожидание клиентского текста про ключи речи в интеграциях.

- [ ] **Step 3: Главная без риска и без «Открыть причину»**

`prototype-home-risk.test.ts` и `prototype-campaigns-list.test.ts` / `prototype-campaign-header.test.ts`: не должно быть `Открыть причину`, колонки «Действия», колонки «Риск / причина». Должно быть: чекбокс, клик по названию, `Обзвонили`, массовые «Приостановить кампании» / «Продолжить обзвон» / «Остановить кампании».

- [ ] **Step 4: Прогнать red**

Run: `npm run test -- tests/prototype-nav.test.ts tests/prototype-campaign-views.test.ts tests/prototype-home-risk.test.ts tests/prototype-campaign-header.test.ts`

Expected: FAIL на старом HTML.

---

### Task 2: Меню, Главная, убрать лишние экраны

**Files:**
- Modify: `prototype.html` (sidebar, `#globalScreens`, удалить секции)
- Modify: инлайн JS `showScreen` / `screenNames`

- [ ] **Step 1: Меню клиента**

Пункты: Главная, Источники, Телефония (не «Интеграции»), Аналитика, Журнал действий. Удалить HTML-секции `campaigns`, `speech`, `scripts`, `reviewQueue`. Главная = список кампаний (перенести таблицу из бывшего `#campaigns`).

- [ ] **Step 2: Колонки Главной**

Только: чекбокс, название (`data-open-campaign="overview"` на имени, не отдельная кнопка), статус, `Обзвонили N из M`. Над таблицей: «Создать кампанию», фильтр статуса, массовые действия. Один H1 «Кампании». Крошка не дублирует «Главная»+«Главная».

- [ ] **Step 3: JS навигации**

`screenNames` без удалённых экранов. `showScreen('analytics')` открывает аналитику. Клик по названию → `openCampaign('overview')`. Убрать обработчики `data-open-campaign="launch"|"report"|"review"|"settings"`.

- [ ] **Step 4: Тесты nav/home**

Run: `npm run test -- tests/prototype-nav.test.ts tests/prototype-home-risk.test.ts`

Expected: PASS для переписанных утверждений. Скрипт парсится.

---

### Task 3: Вкладки кампании и Обзор как место запуска

**Files:**
- Modify: `prototype.html` шапка и вкладки `#campaignWorkspace`
- Modify: `showCampaignTab`
- Modify: `tests/prototype-overview-readiness.test.ts`, `tests/prototype-launch-confirm.test.ts`, `tests/prototype-pause-confirm.test.ts`, `tests/prototype-stop-confirm.test.ts`, `tests/prototype-campaign-header.test.ts`, `tests/prototype-readiness-groups.test.ts`

- [ ] **Step 1: Вкладки**

Оставить `overview`, `base`, `scenario`, `phone`, `calls`. Удалить markup `launch`, `review`, `report`, `settings`. Readiness-группы с Обзора (блокирует / предупреждение) перенести в тело Обзора, не во вкладку Запуск.

- [ ] **Step 2: Шапка Обзора**

Кнопки по статусу: «Запустить кампанию» (только draft/ready, fail-closed), «Приостановить кампанию», «Продолжить обзвон» (только после ручной паузы), «Остановить кампанию». Подтверждения с последствиями, не «Вы уверены?». Тест соединения не меняет статус кампании.

После `auto_paused`: в Обзоре причина человеческим языком, «Продолжить» в списке и шапке нет. Ссылка «Аналитика» (та же подпись, что пункт меню) с фильтром кампании.

- [ ] **Step 3: showCampaignTab**

Ветки только для overview / base / scenario / phone / calls. Функция закрыта до init. Не вызывать `renderReviewQueue` как обязательный init клиентского кабинета.

- [ ] **Step 4: Тесты**

Обновить confirm-тесты на кнопки шапки Обзора. Header без «Открыть причину». Run: `npm run test -- tests/prototype-campaign-views.test.ts tests/prototype-campaign-header.test.ts tests/prototype-launch-confirm.test.ts tests/prototype-pause-confirm.test.ts tests/prototype-stop-confirm.test.ts tests/prototype-overview-readiness.test.ts`

Expected: PASS.

---

### Task 4: База, Источники, Сценарий, Телефония

**Files:**
- Modify: `prototype.html` секции `sources`, `base`, `scenario`, `telephony`, телефония кампании
- Modify: `tests/prototype-sources.test.ts`, `tests/prototype-base-metrics.test.ts`, `tests/prototype-import-report.test.ts`, `tests/prototype-import-mapping.test.ts`, `tests/prototype-scripts.test.ts`

- [ ] **Step 1: Источники**

Файл + «Подключить по API» (форма-контракт, статусы подключено/не подключено). Убрать карточки «не в этом релизе».

- [ ] **Step 2: База кампании**

Файл или API-источник этой кампании. Сохранить разделение «принято в базу» ≠ допуск к звонку.

- [ ] **Step 3: Сценарий**

Только: шаблон, голос, первая фраза, длительность, перевод оператору. Удалить `.script-flow` / логику разговора.

- [ ] **Step 4: Телефония**

Организация: карточки соединений, без чеклиста готовности. Кампания: выбранное соединение, без «что проверяет система». «Проверить соединение» ≠ запуск.

- [ ] **Step 5: Мастер**

Шаги: кампания → база → сценарий → телефония. Убрать шаг «Проверка перед запуском». Финал: «Создать кампанию» / переход на Обзор.

- [ ] **Step 6: Тесты sources/base/wizard**

Run: `npm run test -- tests/prototype-sources.test.ts tests/prototype-base-metrics.test.ts tests/prototype-import-report.test.ts tests/prototype-import-mapping.test.ts tests/prototype-wizard-step1.test.ts tests/prototype-test-call.test.ts`

Expected: PASS. `prototype-scripts.test.ts`: либо удалить (нет библиотеки сценариев), либо переписать на поля вкладки Сценарий.

---

### Task 5: Звонки, Аналитика, Журнал, копирайт

**Files:**
- Modify: `prototype.html` calls + новая секция analytics + audit log
- Modify: `tests/prototype-calls-journal.test.ts`, `tests/prototype-call-card.test.ts`
- Delete or rewrite: `tests/prototype-review-queue.test.ts`, `tests/prototype-report-funnel.test.ts`, `tests/prototype-report-role.test.ts`
- Modify: `PRODUCT_LANGUAGE.md`
- Modify: `TECH_BACKLOG_1SP.md` журнал

- [ ] **Step 1: Звонки**

Шире таблица. Клик по должнику открывает карточку: список попыток, расшифровка ИИ-агент / человек, «запись хранится» / «записи нет» без вымышленного download. Несколько диалогов на должника.

- [ ] **Step 2: Аналитика**

Экран `#analytics`: все кампании, фильтр одной, период, четыре показателя: Обзвонено, Соединилось, Обещания (из завершённых разговоров), Стоимость. Пустые/демо состояния по спецификации.

- [ ] **Step 3: Журнал**

Колонки: время, кто, объект, что изменилось, IP (`не зафиксирован`, если нет). Только действия сотрудников. Фильтры период / сотрудник / кампания.

- [ ] **Step 4: Вычитка**

Все видимые строки: `PRODUCT_LANGUAGE.md` + антипаттерны спецификации §9. Grep запрещённых англицизмов по `prototype.html`. Статус `auto_paused` клиенту: «приостановлена системой». `review` в UI не показывать словом review.

- [ ] **Step 5: Устаревшие тесты**

Удалить или переписать тесты очереди проверок, ролей отчёта, воронки отчёта, библиотеки сценариев — под новые экраны.

- [ ] **Step 6: Полная проверка кабинета**

Run: `npm run test -- tests/prototype-*.test.ts`

Expected: all PASS. Затем: `node --check` инлайн-скрипта (извлечь `<script>` как в nav-тесте). `npm run test` целиком, если время позволяет; минимум все `prototype-*`.

---

## Self-review vs spec

| Спека | Задача |
|---|---|
| §4 меню/вкладки | Task 1–3 |
| §5–6 Главная, входы | Task 2 |
| §6.6–7 запуск на Обзоре | Task 3 |
| §6.2–6.3, 6.7–6.9, §8 мастер | Task 4 |
| §6.4–6.5, 6.10, §9 копирайт | Task 5 |
| §11–12 не закрывать API-разрывы | Global Constraints |

Placeholders не оставлять в UI: API-подключение — явный макет, не «почти живая CRM».
