# Бенчмарк операторских кабинетов: паттерны для ИИ-коллектора

Дата: 2026-08-20  
Статус: research / pattern extraction (код не менялся)  
Объект применения: личный кабинет клиента (`prototype.html` и связанные экраны)  
Связано: [2026-08-17-ux-audit-cabinet.md](2026-08-17-ux-audit-cabinet.md), `PRODUCT_LANGUAGE.md`

Принцип отбора: реальные B2B-продукты с публичным UI (кабинет, help, docs, demo/tour). Лендинги, Dribbble без продукта и «AI chat»-эстетика отсекались. Бренды не копируем — только переносимые паттерны.

---

## 1. Shortlist

| # | RU/INT | Продукт | Тип | URL | Почему релевантен | Полезность |
|---|---|---|---|---|---|---|
| 1 | RU | Naumen Contact Center | Dialer / campaign ops | https://www.naumen.ru/products/phone/tour/features/campaign_management/ | Карточка проекта: статус, расписание, история изменений, единое окно настроек | 5 |
| 2 | RU | FIS Collection (Lite) | Debt collection + compliance | https://fisgroup.ru/products/collection-lite/ | Импорт с валидацией, ФЗ-230 (частота/окна), журнал причин блокировок, dialer | 5 |
| 3 | RU | НОТА МОДУС.Взыскание | Debt collection / strategy | https://nota.tech/products/modus/collection | Стратегии с тестированием до запуска, BPM, дашборды в реальном времени | 4 |
| 4 | RU | Global C (CSBI) | Debt collection / case ops | https://csbi.ru/global-c/ | Конвейер soft→hard→legal, единое окно дела, ФЗ-230, скрины на pickTech | 4 |
| 5 | RU | БИТ.Управление задолженностью | Debt collection / work queue | https://www.1cbit.ru/1csoft/bit-upravlenie-zadolzhennostyu/ (и региональные витрины с описанием АРМ) | История по долгу, планировщик задач, BPM-назначение, плотный 1С-enterprise вид | 4 |
| 6 | RU | Mango Office Contact Center — Исходящий обзвон | Outbound campaign ops | https://docs.mango-office.ru/ru/3_produkty-i-prilozheniya/3_kontakt-tsentr/14_iskhodyashchiy_obzvon/11_1_spisok_kampaniy.html | Таблица кампаний: статус+режим+прогресс; явная машина состояний Запуск/Остановка | 5 |
| 7 | RU | Voximplant Kit | Live monitoring / PDS | https://voximplant.com/kit/docs/reporting/livemonitoring/groups/groups_calls | Live tables, thresholds, pause/resume, Attempt result vs Wrap-up, status log «кто сменил» | 5 |
| 8 | RU | IQDialer (IQTek) | Predictive dialer | https://demo.iqtek.ru/dialer/docs/superviser/what-is-the-iqdialer/ | Кампании/buckets/лиды, CSV+API, расписание, статусы попыток, wallboard | 4 |
| 9 | RU | UIS Колл-центр — Исходящий обзвон | Campaign + roles | https://www.uiscom.ru/academiya/spravochnyj-centr/rabochee-mesto-rukovoditelya/iskhodyashchiy-obzvon/ | Роли Руководитель/Сотрудник, отчёт прогресса и воронки, статусы агента под кампанию | 4 |
| 10 | RU | Oktell Call-центр | Supervisor / outbound tasks | https://wiki.oktell.ru/%D0%9E%D0%BF%D0%B5%D1%80%D0%B0%D1%82%D0%BE%D1%80%D1%81%D0%BA%D0%B8%D0%B9_%D0%B8%D1%81%D1%85%D0%BE%D0%B4%D1%8F%D1%89%D0%B8%D0%B9_%D0%BE%D0%B1%D0%B7%D0%B2%D0%BE%D0%BD | Проект→сценарий→задача→активация; модуль «Ресурсы» для супервизора в реальном времени | 3 |
| 11 | INT | Five9 Supervisor Plus | Campaign state ops | https://documentation.five9.com/bundle/supervisor-plus/page/supervisor-plus/monitoring-campaigns/viewing-campaign-information.htm | Campaign State table; Start / Stop / Force Stop; плотные настраиваемые таблицы | 5 |
| 12 | INT | Genesys Cloud Outbound | Dialer + compliance rules | https://help.genesys.cloud/articles/about-outbound-dialing/ | Contact list + DNC + rules; Compliance Abandon; time-zone windows; rule-driven pause | 5 |
| 13 | INT | NICE CXone (SmartReach / outbound) | Compliance / suppression | https://help.nicecxone.com/Content/acd/channels/additionalchannelfeatures/callsuppression/callsuppression.htm | Разведение DNC vs Call Suppression vs list filter; временные блоки с disposition | 5 |
| 14 | INT | Talkdesk Dialer + Live + Explore Audit | Live campaigns + audit trail | https://support.talkdesk.com/hc/en-us/articles/23457836189467-Outbound-Live-Campaigns | Live progress completed/total; DNCL; edit only when paused; audit before/after | 4 |
| 15 | INT | Collect! (Comtech) | Debt collection work queue | https://www.collect.org/evaluation/screens/ | Collector Work Queue как хаб; compliance unit; account detail + notes trail | 4 |

Дополнительно (не в shortlist 15, но паттерн сильный): **Latitude by Genesys** — enterprise collections, workflow queues, event-level audit ([help](https://help.genesys.com/latitude/liquid_2024r2/mergedProjects/Latitude/desktop/Introduction_to_Latitude.htm)).

---

## 2. Карточки примеров

### RU-1. Naumen Contact Center — управление проектами

**Ссылка:** https://www.naumen.ru/products/phone/tour/features/campaign_management/  
**Тип артефакта:** product feature page + описание карточки проекта (не лендинг-герой).

**Взять**
1. Единая карточка проекта: название, тип, статус, настройки, записи, история изменений — один вход.
2. Активация / блокировка через справочник состояний, а не «магическая кнопка».
3. История изменений параметров проекта как first-class (не dump логов).
4. Копирование / импорт настроенного проекта вместе с компетенциями.
5. Кейсы с историей вызовов и результатом обработки.

**Не брать**
- Омниканальный «всё в одном» как визуальный шум в MVP-кабинете.
- База знаний внутри сценария как обязательный блок первого viewport.

**Куда у нас:** список кампаний, шапка кампании, Журнал действий, вкладки Сценарий/Телефония.

---

### RU-2. FIS Collection (Lite)

**Ссылка:** https://fisgroup.ru/products/collection-lite/  
**Тип:** product page с явным списком модулей АРМ (импорт, ФЗ-230, dialer).

**Взять**
1. Импорт Excel с валидацией и ошибками — качество базы до стратегии.
2. Контроль ФЗ-230: частота, окна, **журнал причин блокировок**.
3. Типы телефонии разделены: ручные / авто / предиктивные.
4. Словари итогов и правила перезвонов — язык операторов, не «AI outcome».
5. Compliance как встроенный контур, не отдельный «красивый» экран.

**Не брать**
- Grafana как основной UI кабинета (оставить для аналитиков).
- Обещания ROI/KPI на операторском входе.

**Куда у нас:** База / импорт, readiness, мониторинг рисков, журнал блокировок/решений, аналитика по событиям.

---

### RU-3. НОТА МОДУС.Взыскание

**Ссылка:** https://nota.tech/products/modus/collection  
**Тип:** product page (стратегии, BPM, тестирование до запуска).

**Взять**
1. Тестирование стратегии **перед** запуском.
2. Визуальная настройка стратегий коммуникаций + анализ эффективности после.
3. Единый фронт по стадиям взыскания (мягкий переход soft→hard без смены «приложения»).

**Не брать**
- Тяжёлый BPM-конструктор в первом релизе кабинета.
- Маркетинговые «лучшие российские» формулировки в UI.

**Куда у нас:** readiness / controlled launch, сценарий, Обзор кампании.

---

### RU-4. Global C (CSBI)

**Ссылки:** https://csbi.ru/global-c/ · скрины UI: https://picktech.ru/product/sistema-dlya-avtomatizatsii-vzyskaniya-global-c/  
**Тип:** product + каталог со скриншотами интерфейса.

**Взять**
1. Конвейер стадий в одном продукте (досудебная / судебная / исполнительная) — статусы дела, не карточки KPI.
2. Единое окно работы с должником: контакты, документы, статусы.
3. Акцент на соответствии ФЗ-230 как операционное свойство.

**Не брать**
- Судебный документооборот в объём телефонного MVP.
- Low-code платформу как визуальный язык кабинета.

**Куда у нас:** очередь «требует проверки», карточка должника/звонка, статусы кампании.

---

### RU-5. БИТ.Управление задолженностью

**Ссылка (функционал АРМ):** https://a2is.ru/catalog/programmy-dlya-vzyskaniya-dolgov/bit-upravlenie-zadolzhennostyu  
**Тип:** описание возможностей + скрины на pickTech.

**Взять**
1. История работы по долговому обязательству: запланированные / выполненные / просроченные задачи рядом.
2. BPM-назначение задач ответственным — handoff как очередь работ.
3. Плотная табличная эстетика 1С/enterprise: спокойно, без glow.

**Не брать**
- Desktop-only ощущение и перегруженные модальные формы 1С «как есть».
- ЛК должника как часть операторского кабинета.

**Куда у нас:** очередь проверки, журнал действий, список кампаний.

---

### RU-6. Mango Office — Исходящий обзвон

**Ссылка:** https://docs.mango-office.ru/ru/3_produkty-i-prilozheniya/3_kontakt-tsentr/14_iskhodyashchiy_obzvon/11_1_spisok_kampaniy.html  
**Тип:** help с описанием таблицы и скрином списка кампаний.

**Взять**
1. Список = таблица: Название, Статус, Режим, Контактов, Выполнено %, приоритет, даты.
2. Машина статусов: Запланирована → Выполняется → Останавливается → Остановлена → Завершена; действия зависят от статуса.
3. Отдельные состояния «Останавливается» (переход) и «Остановлена» (стабильно).
4. Фильтры по статусу / автору / режиму с сохранением для пользователя.
5. Русский B2B-язык без англицизмов в статусах.

**Не брать**
- Контекстное меню как единственный способ управления (нужны явные CTA).
- Смешение метрик времени обработки оператора с compliance-риском в одной строке без иерархии.

**Куда у нас:** список кампаний, controlled launch, pause/stop.

---

### RU-7. Voximplant Kit — Live monitoring

**Ссылки:** https://voximplant.com/kit/docs/reporting/livemonitoring/groups/groups_calls · https://voximplant.com/blog/ekit-news-04-25-acc  
**Тип:** docs + release notes по UI.

**Взять**
1. Live-таблицы с порогами (threshold + цвет) — риск визуально сильнее «среднего KPI».
2. Pause / resume кампании как права супервизора, отдельно от редактирования настроек.
3. История звонков: **Attempt result** (система) и **Wrap-up code** (агент) — две колонки.
4. Лог смены статуса: кто изменил — агент / супервизор / система.
5. Сохранённые views дашборда для ролей.

**Не брать**
- Перегруженный widget-конструктор на главной пилота.
- Фиолетовый бренд-акцент Kit в нашем визуальном языке.

**Куда у нас:** мониторинг звонков, Обзор, Журнал действий, аналитика.

---

### RU-8. IQDialer (IQTek)

**Ссылки:** https://demo.iqtek.ru/dialer/docs/superviser/what-is-the-iqdialer/ · UI tour: https://www.youtube.com/watch?v=APFrTBIRn7M  
**Тип:** product docs + видео интерфейса супервизора.

**Взять**
1. Иерархия: кампания → bucket/list → лиды; CSV и API-загрузка.
2. Правила обработки статусов попыток (NOANSWER, BUSY, …) явно настраиваются.
3. Редактирование лидов «на лету» без потери кампании.
4. Расписание с часовыми поясами, праздниками, интенсивностью.
5. Wallboard ключевых ops-метрик для зала / супервизора.

**Не брать**
- Predictive как default для маленьких пилотов (сами пишут: <20–30 операторов вреден).
- Геймификацию «дух соперничества» на wallboard для compliance-продукта.

**Куда у нас:** База, сценарий/телефония, мониторинг, импорт.

---

### RU-9. UIS — Исходящий обзвон

**Ссылка:** https://www.uiscom.ru/academiya/spravochnyj-centr/rabochee-mesto-rukovoditelya/iskhodyashchiy-obzvon/  
**Тип:** academy / help ЛК.

**Взять**
1. Жёсткое разделение ролей: Руководитель управляет кампаниями, Сотрудник только участвует.
2. Отчёт: прогресс, воронка эффективности, качество дозвона.
3. Статусы агента, релевантные кампании («Исходящий обзвон» vs «Доступен»).
4. Понятный RU-текст инструкций = тон microcopy кабинета.

**Не брать**
- Упрощённый SMB-обзвон без compliance-слоя как эталон полноты.
- Смешение «отменить кампанию» и compliance auto-pause без разных причин.

**Куда у нас:** RBAC-поверхность, список кампаний, аналитика.

---

### RU-10. Oktell Call-центр

**Ссылки:** https://wiki.oktell.ru/Операторский_исходящий_обзвон · https://wiki.oktell.ru/Ресурсы  
**Тип:** wiki продукта.

**Взять**
1. Явный pipeline: Проект → диалоговый сценарий → задача → Активировать / сменить статус.
2. Модуль «Ресурсы»: супервизор видит операторов, очереди, линии в реальном времени.
3. Задача с расписанием и ресурсами до активации = readiness-мышление.

**Не брать**
- Устаревшую desktop-плотность без современной веб-типографики.
- Drag-and-drop распределения как основной UX для compliance-pause.

**Куда у нас:** мастер кампании, readiness, мониторинг.

---

### INT-11. Five9 Supervisor Plus

**Ссылки:** https://documentation.five9.com/bundle/supervisor-plus/page/supervisor-plus/monitoring-campaigns/viewing-campaign-information.htm · Start/Stop/Force Stop: https://documentation.five9.com/bundle/admin-console/page/admin-console/campaigns/managing-campaigns.htm

**Взять**
1. Campaign State table как главный ops-экран (статус иконкой + имя).
2. **Stop** (graceful) vs **Force Stop** (немедленный) — разные состояния и последствия.
3. Кастомизация колонок, freeze, sort — плотность под роль.
4. Progress / penetration по dialing list, не абстрактные «insights».

**Не брать**
- Right-click как единственный action menu без кнопок.
- Перенос всей Supervisor Plus IA целиком.

**Куда у нас:** список кампаний, pause/stop, мониторинг.

---

### INT-12. Genesys Cloud Outbound

**Ссылки:** https://help.genesys.cloud/articles/about-outbound-dialing/ · rules: https://help.genesys.cloud/articles/create-set-campaign-rules/ · settings: https://help.genesys.cloud/articles/outbound-settings/

**Взять**
1. Кампания собирается из строительных блоков: contact list, DNC, scripts, rule sets, dialing mode.
2. Compliance Abandon Rate и callable windows — системные ограничения, видимые в настройках.
3. Campaign rules: условие → действие (Turn Off, change mode, set abandon rate).
4. Невалидный list показывается с **причиной, почему unassignable**.
5. Planning guide / checklist мышление перед конфигурацией.

**Не брать**
- Полный Rule Management как UI для пилота МФО (оставить упрощённый readiness + auto-pause reasons).
- NANP/TCPA-специфику без адаптации под ФЗ-230.

**Куда у нас:** readiness, сценарий/телефония, автопауза, controlled launch.

---

### INT-13. NICE CXone — DNC / Call Suppression

**Ссылки:** https://help.nicecxone.com/Content/acd/channels/additionalchannelfeatures/callsuppression/callsuppression.htm · DNC: https://help.nicecxone.com/content/acd/channels/additionalchannelfeatures/dnc/managednc.htm

**Взять**
1. Три разных инструмента: **DNC** (постоянно), **Call Suppression** (временно + disposition), **list filter** (сегмент).
2. У suppression есть start/end и skill scope — статус+причина+срок.
3. Язык различий вписан в help = хороший образец для подсказок в UI.

**Не брать**
- Studio-скрипты как способ «доказать compliance» пользователю кабинета.
- Скрывать suppression внутри технических skill ID без человекочитаемой причины.

**Куда у нас:** исключения/база, причины «не звонили», очередь проверки, автопауза.

---

### INT-14. Talkdesk Dialer + Live + Audit Logs

**Ссылки:** https://support.talkdesk.com/hc/en-us/articles/23457836189467-Outbound-Live-Campaigns · Audit: https://support.talkdesk.com/hc/en-us/articles/10465674345371-Release-Notes-Talkdesk-Explore · API note: pause before edit

**Взять**
1. Live widget: record progress `completed/total`, eligible records, DNCL в completed-статусах.
2. Нельзя редактировать running-кампанию — сначала pause (безопасный ops-паттерн).
3. Audit report: Resource / Previous value / Updated value — decision trail, не syslog.
4. Фильтр live по campaign name + dialing mode.

**Не брать**
- Отдельный «Explore» как единственное место аудита (у нас журнал должен быть в кабинете).
- AI-branding в ops-виджетах.

**Куда у нас:** мониторинг, Журнал действий, безопасное редактирование сценария.

---

### INT-15. Collect! — Work Queue & Compliance

**Ссылки:** https://www.collect.org/evaluation/screens/ · Dashboard compliance unit: https://collectsoftware.biz/cv12/Help/dashboard.html

**Взять**
1. Work Queue как хаб дня: задачи, не дашборд-карточки.
2. Debtor Account Screen: compliance details + financial summary + tabs — плотность данных.
3. Dashboard Compliance unit: документы, training, complaints — отдельный контур риска.
4. Operator Activity для floor display — ops, не marketing.

**Не брать**
- Legacy desktop look «как есть».
- Смешение client remittance / month-end в телефонный кабинет.

**Куда у нас:** очередь «требует проверки», карточка звонка/кейса, compliance-роль.

---

## 3. Сводка паттернов

### IA / навигация
- Кампания/проект — центр; внутри одна карточка с вкладками/секциями, а не россыпь виджетов.
- Глобально: список кампаний, очередь исключений/проверки, журнал, аналитика — по ролям (UIS, Naumen, Collect!).
- Супервизорский контур отдельно от настройки (Oktell Resources, Five9 Supervisor, Kit Live).

### Таблицы
- Таблица — основной контейнер ops (Mango, Five9, Kit, Talkdesk Live).
- Колонки настраиваются; статус и причина/прогресс рядом; % выполнения и counts, не «insights».
- Drill-down в карточку строки (кампания / звонок / должник).

### Статусы и риски
- Машина состояний с переходными статусами (Mango «Останавливается»; Five9 Stop vs Force Stop).
- Risk/compliance выше vanity KPI (Kit thresholds; FIS журнал блокировок; Genesys abandon).
- Статус + причина + кто/что изменил (Kit status log; Talkdesk before/after; FIS block reason).
- Разные сущности блокировки: DNC / temporary suppression / campaign pause (NICE).

### Формы и мастера
- Сборка кампании из блоков: база → сценарий → телефония/режим → расписание → запуск (Genesys, Oktell, Naumen).
- Readiness/checklist до активации; тест стратегии ≠ боевой запуск (МОДУС, Genesys planning).
- Импорт с отчётом ошибок и частичным допуском (FIS, IQDialer CSV).
- Edit running: сначала pause (Talkdesk).

### Визуальный язык
- Спокойный enterprise: нейтральные поверхности, плотные таблицы, статус-бейджи без glow/glass.
- Цвет = порог/риск/состояние, не декоративный градиент.
- RU: естественные статусы («Выполняется», «Остановлена», «приостановлена системой»), без «AI magic».

### Microcopy (особенно RU)
- Опираться на `PRODUCT_LANGUAGE.md` + тон Mango/UIS/FIS: «журнал причин блокировок», «вернуть в обзвон», «требует проверки».
- Система vs человек в подписях исходов (Attempt result / Wrap-up; у нас: статус попытки vs исход разговора).
- Причина отказа в звонке человекочитаемо рядом со статусом, не только code.

---

## 4. Рекомендации для нашего кабинета

### Топ-10: AI-дизайн → рыночный паттерн → у нас → эффект

| # | Проблема AI-дизайна | Рыночный паттерн | Как применить у нас | Эффект |
|---|---|---|---|---|
| 1 | KPI-карточки важнее риска | Risk/state выше метрик (Kit thresholds, Five9 Campaign State) | На Главной и в списке: статус + причина автопаузы/блокировки выше любых счётчиков; KPI только из API или с меткой «демо» | Supervisor видит, где тушить огонь |
| 2 | Карточки ради красоты | Ops-таблица как primary (Mango, Five9) | Список кампаний — плотная таблица: статус, причина, readiness, прогресс базы, режим; карточки убрать | Операционная ясность, меньше «витрины» |
| 3 | Один статус «paused» на всё | Stop ≠ Force Stop ≠ Auto-pause ≠ Review (Five9, Mango, NICE) | Развести: `приостановлена системой` / ручная остановка / завершена; CTA зависят от статуса | Нет ложного «Продолжить» |
| 4 | Зелёный чеклист до проверки | Readiness из системы + блокирует кнопку (Genesys invalid list reason; FIS) | Группы «Блокирует запуск» / «Предупреждение»; launch disabled пока не ready; без зелёного HTML до API | Controlled launch без самообмана |
| 5 | Тест = запуск | Test strategy / sandbox ≠ activate (МОДУС, Oktell activate) | Тестовый звонок не переводит кампанию в «работает»; запуск — модалка режима/объёма | Доверие пилота и compliance |
| 6 | Review сам снимает паузу | Decision queue ≠ campaign control (Collect! queue; Talkdesk pause-to-edit) | Очередь проверки меняет только item; resume — чеклист на «Запуске» | Разделение QA и campaign ops |
| 7 | Логи как dump | Decision trail before/after (Talkdesk Audit; Naumen history; FIS block journal) | Журнал: кто / что / было→стало / почему; фильтр по кампании и типу решения | Доказуемость для банка/МФО |
| 8 | «Не дозвонились» без причины | Attempt vs outcome; DNC vs suppression reason (Kit, NICE, Genesys) | В журнале звонков: соединение + исход + решение allow/block + reasonText | Разбор «почему не звонили» без открытия всего drawer |
| 9 | Импорт = успех | Validation report + quarantine (FIS, IQDialer) | Найдено / готовы / на проверке / дубли; продолжить с валидными | Честное качество базы |
| 10 | Универсальный «ИИ-ассистент» тон | Спокойный RU B2B (Mango/UIS/PRODUCT_LANGUAGE) | Убрать glow, purple, «магию»; бренд вторичен статусу риска; тексты из словаря | Enterprise-доверие |

### Anti-patterns нейросетевого кабинета (от чего уходим)

- Hero-пустота и крупные карточки вместо таблиц.
- Purple/indigo gradients, glow, glassmorphism, «AI orb».
- KPI без знаменателя и без источника (demo как факт).
- Один CTA «Продолжить» / «Перенастроить» на автопаузу.
- Chat-first или «спроси ассистента» вместо очереди дел.
- Статус без причины; код ошибки без next step.
- Review = silent override кампании.
- Тест, неотличимый от боевого режима.
- Англицизмы в статусах (`running`, `wrap-up`) при наличии русских терминов в словаре.
- Декоративные empty states вместо пустой, но настоящей очереди проверок.

---

## 5. Метод

### Где искали
- RU collection: обзоры рынка (CSBI «4 системы»), сайты FIS / НОТА / Global C / БИТ, TAdviser.
- RU dialer/CC: Naumen, Mango docs, Voximplant Kit docs, IQTek docs+UI video, UIS Academy, Oktell wiki.
- INT dialer: Five9 Supervisor Plus docs, Genesys Cloud Outbound help, NICE CXone help, Talkdesk Live/Explore.
- INT collection: Collect! evaluation screens & help; (фон) Latitude by Genesys help.

### Как отсекали
- Лендинги без описания АРМ / без help-скринов.
- Маркетинговые «AI contact center» без campaign state machine.
- Dribbble/Behance без shipped product.
- Consumer CRM/телефония без campaign ops.
- Примеры только с KPI-карточками и без статусов/таблиц/compliance.
- Юрисдикционные INT-паттерны без переноса (TCPA-only) — брали только обобщаемые (DNC vs suppression, abandon, audit before/after).

### Ограничения исследования
- Полный интерактивный доступ в enterprise-кабинеты без демо-аккаунта недоступен; опора на официальные docs, wiki, скрины каталогов и UI-туры.
- Не выдумывали продукты и не предлагали обход compliance.

### Связь с уже найденным UX-аудитом
Рекомендации 1–6 и 10 напрямую усиливают критичные находки из [2026-08-17-ux-audit-cabinet.md](2026-08-17-ux-audit-cabinet.md) (риск выше KPI, очередь проверки, тест≠запуск, review≠resume, readiness без ложной зелени). Этот бенчмарк даёт рыночные референсы и язык паттернов для тех же точечных доработок.
