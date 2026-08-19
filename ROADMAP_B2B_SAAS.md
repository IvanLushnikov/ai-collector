# Roadmap B2B SaaS для прототипа AI-коллектора
Дата анализа: 14.08.2026

## 1. Что сейчас есть в прототипе

В репозитории два статических HTML-прототипа:

- `prototype.html` — кликабельный личный кабинет для пользователя: главная, кампании, источники данных, телефония, сценарии, мастер создания кампании, карточка кампании, звонки, отчёт, настройки.
- `index.html` — продуктовый decision dashboard: ICP, CJM, сценарий звонка, compliance, архитектура, конкуренты, калькулятор экономики, пилот, риски.

Текущий прототип уже хорошо показывает целевой бизнес-сценарий: клиент создаёт кампанию раннего взыскания, загружает базу, выбирает телефонию и сценарий, проходит проверки, запускает обзвон и смотрит результат.

Главная ценность, которую прототип правильно подсвечивает: продукт должен быть не просто "роботом для звонков", а управляемой compliance-first платформой, где каждый звонок разрешён правилами, записан, воспроизводим и может быть объяснён клиенту, юристу, службе ИБ и регулятору.

## 2. Ключевой вывод

До B2B SaaS продукту не хватает не экранов, а промышленного слоя:

- реальной модели данных и backend API;
- мультиарендности и разграничения доступа;
- импорта, валидации и версионирования клиентских данных;
- интеграций с телефонией, CRM/АБС/collection-системами;
- compliance engine, который физически блокирует запрещённые звонки;
- audit trail по каждому действию, правилу, звонку и версии сценария;
- операционной панели для контроля качества, жалоб, инцидентов и ручного перевода;
- биллинга, тарифов, лимитов, SLA и клиентской отчётности.

Поэтому правильная стратегия: идти от controlled pilot к production SaaS, а не сразу строить масштабную платформу.

## 3. Что нужно доработать для B2B SaaS

### 3.1. Продукт и сценарии клиента

Нужно превратить демо-путь в полноценный рабочий процесс:

- роли: владелец аккаунта, руководитель взыскания, оператор, аналитик качества, compliance officer, администратор интеграций;
- статусы кампании: черновик, на проверке, готова, работает, автопауза, завершена, архив;
- workflow согласования: изменение базы, сценария, телефонии или расписания должно создавать новую версию и требовать повторной проверки;
- полноценные пустые, ошибочные и пограничные состояния: нет базы, плохой файл, нет телефонии, не пройдена маркировка, очередь операторов перегружена, превышены лимиты контактов;
- карточка должника и звонка: история контактов, результат диалога, запись, транскрипт, извлечённые сущности, причина отказа, обещание платежа, ручная корректировка;
- отчёты не только по PTP, а по payment outcome, kept PTP, cost per payment, жалобам, нарушениям и качеству извлечения.

### 3.2. Compliance и юридические ограничения

Для взыскания compliance должен быть ядром продукта, а не справочным экраном:

- отдельный compliance engine до оркестратора звонка;
- правила времени звонков, количества контактов, часовых поясов, праздников, suppression list, отзыва согласия, уязвимых клиентов и спорных долгов;
- mandatory disclosure: агент должен представиться как автоматизированный интеллектуальный агент;
- обязательный human handoff по запросу должника;
- запрет раскрытия долга третьим лицам;
- журнал решений: почему звонок был разрешён или заблокирован;
- версионирование правил и доказуемое воспроизведение решения задним числом;
- экспорт доказательной базы для внутренней проверки, клиента и возможного разбирательства.

Риск: без этого продукт нельзя безопасно масштабировать в банки, МФО и ПКО.

### 3.3. Данные и интеграции

Прототип показывает загрузку файла, но для B2B SaaS нужны промышленные контуры:

- импорт CSV/XLSX с профилями маппинга, дедупликацией, quality report и quarantine-строками;
- API/SFTP/webhook-интеграции с CRM, АБС, collection system, DWH;
- синхронизация статусов: долг закрыт, спор, банкротство, отзыв согласия, запрет контакта, обещание платежа, платеж поступил;
- idempotency для повторных загрузок и событий;
- защита от устаревшей базы: звонок должен проверять актуальное состояние долга перед стартом;
- tenant isolation: данные одного клиента не должны смешиваться с данными другого;
- политика хранения записей, транскриптов и персональных данных.

### 3.4. Телефония и голосовой контур

Нужны не только настройки номера, а управляемая инфраструктура звонков:

- интеграция с одним основным провайдером на MVP и резервный путь позже;
- SIP/Voice API, CDR reconciliation, запись, статусы звонка, AMD, retry policy;
- маркировка звонков и контроль отображения имени;
- лимиты одновременных линий по клиенту и кампании;
- мониторинг качества: answer rate, dropped calls, transfer failures, latency, ASR/TTS errors;
- сценарии отказов: провайдер недоступен, запись не сохранилась, CDR не совпал, очередь операторов переполнена;
- механизм автопаузы кампании при нарушении SLA или safety-событиях.

- Прототипный `calls` workflow в текущем цикле должен использовать `GET /tenants/:tenantId/campaigns/:campaignId/calls` как основной источник и явно показывать статус (`live` / `демо`) с fallback на локальные данные при падении API.

### 3.5. AI, сценарии и качество

LLM должен работать внутри строгого безопасного контура:

- state machine сценария: разрешённые шаги, запрещённые действия, условия переходов;
- prompt/version registry: версии промптов, голосов, правил, моделей и параметров;
- regression tests на golden set диалогов;
- red-team набор: угрозы, третье лицо, перебивания, шум, спор по долгу, запрос оператора, prompt injection;
- извлечение структурированных результатов: PTP amount/date, причина, dispute, hardship, contact preference, handoff reason;
- ручная разметка и QA-интерфейс;
- метрики качества: ASR WER на доменном корпусе, entity extraction accuracy, hallucination/unsafe rate, handoff success.

### 3.6. Безопасность и enterprise readiness

Для B2B продаж крупным клиентам потребуется:

- SSO/SAML/OIDC;
- RBAC и audit log действий пользователей;
- tenant isolation на уровне БД, файлов, очередей и логов;
- управление секретами интеграций;
- шифрование данных в покое и при передаче;
- политики retention/deletion/export;
- rate limits и защита API;
- backup/restore, RPO/RTO;
- журнал инцидентов;
- документация для ИБ клиента.

### 3.7. Монетизация и операционная модель

Нужно заранее решить коммерческую единицу:

- оплата за минуту соединения;
- оплата за успешный диалог;
- подписка + пакет минут;
- enterprise fee + usage;
- success fee только как дополнительная модель, потому что атрибуция платежей сложна.

Для каждого тарифа нужны:

- invoice-grade usage ledger;
- сверка CDR с биллингом;
- лимиты потребления и предупреждения;
- себестоимость по телефонии, ASR, TTS, LLM, хранению, поддержке;
- отчёт клиенту: за что начислено, какие звонки вошли, какие исключены.

## 4. Roadmap

### Этап 0. Discovery и подготовка пилота, 4-6 недель

Цель: проверить, что продукт можно легально и технически запускать на ограниченном сегменте.

Сделать:

- выбрать beachhead-сегмент: МФО или ПКО, DPD 1-30, один продукт, один сценарий;
- описать legal call-flow и ограничения вместе с юристом;
- получить обезличенный корпус звонков и реальные baseline-метрики;
- выбрать одного telecom-провайдера;
- описать минимальный data contract для базы и результатов;
- определить primary метрики пилота: confirmed violations = 0, payment outcome, complaint rate, contribution margin;
- согласовать rollback и автопаузу.

Exit criteria:

- есть владелец пилота у клиента;
- есть легальный путь;
- есть тестовые данные;
- есть baseline;
- есть список hard gates перед live traffic.

### Этап 1. MVP Lab, 8-10 недель

Цель: собрать рабочее ядро без масштабирования на много клиентов.

Сделать:

- backend API для кампаний, баз, звонков, сценариев, результатов и пользователей;
- базовая БД и файловое хранилище;
- импорт CSV/XLSX с маппингом и quality report;
- compliance engine v1: время, лимиты, suppression, запрет третьих лиц, handoff;
- один voice provider;
- orchestrator звонка со state machine;
- запись, транскрипт, извлечение PTP/причины/следующего действия;
- UI для кампании, звонков, отчёта, ручной проверки;
- golden set и автоматические regression tests сценария.

Exit criteria:

- можно создать кампанию из UI и довести её до тестового звонка;
- каждый звонок имеет audit trail;
- unsafe ответы блокируются на тестовом наборе;
- отчёт строится из реальных событий, а не из моков.

### Этап 2. Controlled Pilot, 6-8 недель

Цель: запустить ограниченный live-трафик и доказать безопасность.

Сделать:

- 10k записей или меньше, если юристы/операции требуют меньший старт;
- randomized holdout/control group;
- ежедневный QA звонков и жалоб;
- автопауза при violation, росте жалоб, сбое записи, перегрузе handoff;
- сверка CDR, transcript, результата и платежного статуса;
- отчёт по payment outcome, kept PTP, cost per payment, complaint rate;
- post-pilot decision memo: scale / iterate / stop.

Exit criteria:

- 0 подтверждённых нарушений;
- complaint rate не хуже контрольной группы;
- payment outcome не хуже текущего процесса;
- contribution margin положительная на измеренном COGS;
- операторы выдерживают handoff SLA.

### Этап 3. Production SaaS v1, 3-4 месяца

Цель: сделать продукт пригодным для нескольких платящих клиентов.

Сделать:

- полноценная мультиарендность;
- RBAC, audit log, SSO для enterprise-клиентов;
- версии сценариев, правил, промптов и моделей;
- клиентские окружения: dev/test/prod или sandbox/prod;
- интеграции API/SFTP/webhooks;
- usage ledger и биллинг;
- мониторинг, алерты, incident management;
- self-service отчёты и exports;
- SLA dashboard;
- документация для onboarding, ИБ и эксплуатации.

Exit criteria:

- второй клиент подключается без переписывания кода;
- права и данные клиентов изолированы;
- billing и usage сверяются;
- есть runbook поддержки;
- есть стандартный onboarding checklist.

### Этап 4. Scale и enterprise, 6-12 месяцев

Цель: выйти из пилотной модели в масштабируемую enterprise-платформу.

Сделать:

- несколько telecom-провайдеров и резервирование;
- high availability, DR, backup restore drills;
- on-prem/private cloud опция для крупных клиентов;
- расширенные модели сценариев: разные продукты, регионы, сегменты, очереди операторов;
- advanced QA: выборочная разметка, автоматический risk scoring диалогов;
- marketplace/библиотека сценариев и правил;
- финансовая аналитика по recovery uplift и unit economics;
- formal security review, pentest, compliance package.

Exit criteria:

- продукт выдерживает 100k-1m записей в месяц на клиента;
- отказ одного провайдера не останавливает весь сервис;
- клиент может пройти ИБ и юридическое согласование по стандартному пакету;
- масштабирование не требует ручной разработки под каждую кампанию.

## 5. Приоритетный backlog на ближайший инкремент

Детализированный технический backlog уровня 1 story point вынесен в `TECH_BACKLOG_1SP.md`.
Промт цели для последовательной реализации под Codex Spark 5.3 вынесен в `CODEX_SPARK_5_3_GOAL.md`.

P0:

- описать доменную модель: Tenant, User, Role, Campaign, DebtorRecord, CallAttempt, CallResult, ScriptVersion, ComplianceDecision, TelephonyConnection, UsageEvent;
- выбрать backend stack и БД;
- реализовать создание кампании и импорт базы на реальных данных;
- сделать compliance decision log;
- подключить один voice provider в sandbox;
- заменить моковые цифры отчёта на расчёт из событий.

P1:

- RBAC и audit log действий пользователей;
- журнал звонков с записью, транскриптом и структурированным результатом;
- версии сценариев и повторная проверка после изменений;
- автопауза кампании;
- базовый usage ledger;
- QA-интерфейс для проверки диалогов.

P2:

- SSO;
- API/SFTP интеграции;
- биллинг и коммерческие лимиты;
- BYOK ключей SpeechKit / YandexGPT / GigaChat (ADR 0005);
- advanced analytics;
- второй telecom provider;
- on-prem/private cloud assessment.

## 6. Метрики продукта

Safety:

- confirmed violation rate;
- complaint rate;
- third-party disclosure rate;
- handoff request success rate;
- share of calls with complete audit trail.

Value:

- payment conversion;
- kept PTP rate;
- recovered amount;
- cost per payment;
- uplift vs control group.

Operations:

- answer rate;
- successful dialog rate;
- ASR/TTS/LLM error rate;
- transfer latency;
- campaign auto-pause count;
- CDR reconciliation mismatch rate.

Commercial:

- gross margin by tenant;
- contribution margin by campaign;
- usage overage;
- support cost per tenant;
- implementation time to first live campaign.

## 7. Главные риски

- Юридический риск: нельзя запускать массовые звонки без подтверждённого call-flow и правил ФЗ-230/152-ФЗ/телеком-контуров.
- Репутационный риск: один некорректный диалог может перевесить экономию на операторах.
- Риск данных: устаревшая база или неверный статус долга создаёт прямой compliance-инцидент.
- Риск AI: свободный LLM без state machine и regression tests неприемлем для взыскания.
- Риск экономики: публичная цена конкурентов не равна полному COGS; маржу надо считать на реальных CDR и vendor costs.
- Риск enterprise-продаж: без SSO, RBAC, audit log, retention и ИБ-документации крупный клиент не пройдёт закупку.

## 8. Статус технологического roadmap на 19.08.2026

Оценка ниже основана на текущих артефактах репозитория и `TECH_BACKLOG_1SP.md`, а не на предположениях о внешней готовности команды. Последняя закрытая UX-волна: `T-229` (клиентский кабинет CJ). Открытая очередь: `T-230`–`T-243`.

Полная карта необходимых технологий по этапам (core / platform / adjacent, включая БД, хостинг, телефонию, ASR/TTS, LLM, промпты и ФЗ-контроли) зафиксирована в `docs/architecture/2026-08-17-technology-map.md` и кратко отражена в PRD, раздел 22. Продуктовый rulebook: `docs/compliance/rulebook-v1.md`. Направление live-телефонии: `docs/decisions/0003-live-voice-provider.md`. Направление speech/LLM: `docs/decisions/0004-speech-llm-stack.md`.

### 8.1. Что уже закрыто

- Сформирован backend-контур MVP Lab: стек, базовая структура сервера, тестовый контур, Prisma-схема и tenant-scoped доменная модель.
- Реализованы базовые API для кампаний, импорта базы, compliance check, sandbox-звонка, журнала звонков, QA-разметки, версий сценария, usage ledger и telephony connections.
- Появились ключевые control-механизмы: tenant context, RBAC v0, AuditLog, compliance decision log, автопауза, usage events и отчёт кампании из реальных событий.
- Прототип `prototype.html` пересобран по CJ-спеке (`T-229`): канонический путь менеджера, меню без админ-контура. Частично API-backed: calls, report, readiness-summary, audit-logs; волна `T-232`–`T-238` доводит до полного API-backed flow.
- Backend pilot-ready compliance: frequency 1/2/8, suppression, праздники, legalBasis, BYOK/speech/dialogue skeletons, docker-compose + BullMQ skeleton.

### 8.2. Чего ещё критически не хватает

- Клиентский кабинет не end-to-end API-backed: список кампаний, мастер создания, импорт, запуск/пауза/стоп, аналитика — частично demo/local (`T-232`–`T-238`).
- Нет live-маршрута звонка и HTTP интеграций Exolve/SpeechKit (`T-149`, `T-157` blocked до DPA/legal).
- Runtime orchestrator не wired end-to-end; CDR reconciliation и payment outcome для пилота отсутствуют.
- `npm run typecheck` красный (~147 ошибок) — CI blocker (`T-230`).
- Admin-контур (речь/BYOK, внутренняя QA-очередь) вынесен из клиентского меню, отдельная поверхность не спроектирована.
- Enterprise: SSO, real auth, invoice-grade billing, SLA/monitoring — в основном docs/заготовки.

### 8.3. Качественная оценка по этапам

- Этап 0. Discovery и подготовка пилота: `35%`.
  Технический rulebook и skeletons есть; нет legal memo, DPA, baseline и формализованных hard gates для live.
- Этап 1. MVP Lab: `75%`.
  Backend и compliance pilot rules сильны; CJ-IA закрыта (`T-229`); остался API-backed UI и typecheck.
- Этап 2. Controlled Pilot: `12%`.
  Заделы QA, отчёт, автопауза, jobs; нет live HTTP, orchestrator wiring, CDR, payment outcome, пилотного ритма.
- Этап 3. Production SaaS v1: `20%`.
  Есть фундамент под multi-tenant, RBAC, audit и usage, но production-контур для нескольких клиентов пока не собран.
- Этап 4. Scale и enterprise: `5%`.
  Есть только отдельные подготовительные decision/doc-артефакты; масштабирование, multi-provider и enterprise package ещё фактически не начаты.

### 8.4. UX-аудит пути `создание кампании → импорт → readiness → launch → calls → review → report` (MVP Lab / Controlled Pilot)

- `T-065 (16.08.2026)`: выполнен полный gap-аудит по 7 этапам канонического потока. Важные выводы: инфраструктурные API-цепочки для `campaign`, `debtors/import`, `telephony`, `scripts`, `calls` и `report` уже частично готовы, но в прототипе остаются несоответствия формата состояния и объяснимости risk/actions.

#### Карта разрывов по этапам (оценка T-065)

- `создание кампании` — MVP-critical: в UI есть мастер и статусы, но backend статус `draft/review/ready/running` не всегда служит источником истины в прототипе. Нужны явные сообщения об ошибках API, без которых возможно псевдоуспешное завершение flow.
- `импорт` — MVP-critical: есть контракт `debtors/import` и parser/validator, но в UI пока есть блоки с локально зафиксированными числами и нет единообразной визуализации `accepted/rejected/errors`, поэтому не закрыта доверенность audit-first для quality report.
- `readiness` — MVP-critical: локальные «плашки» готовы, но источник фактов (`DebtorRecord`, `ScriptVersion`, `TelephonyConnection`, `ComplianceDecision`) не связан с единой canonical моделью статуса readiness.
- `launch` — MVP-critical: в прототипе есть simulation/теги запуска и controlled flow, но не полностью зафиксирован верифицированный backend-переход с role/actor gate и обязательным audit event на каждый переход.
- `calls` — Controlled Pilot, но частично затрагивает MVP: API-листинг и карточка уже есть, но proof bundle по всем кейсам (compliance decision + result + usage) ещё не отображается консистентно в одном экране для всех `live/demo` записей.
- `review` — Controlled Pilot critical: отдельная review-очередь выделена по состоянию реализации только визуально; для MVP нужно хотя бы подготовить единый тип карточки и поля очереди, чтобы рискованные события не терялись между экраном call и общим report.
- `report` — Controlled Pilot: базовая интеграция с `GET /tenants/:tenantId/campaigns/:campaignId/report` есть, но критично добавить дриллдаун к первичным событиям/записям и link из KPI в конкретный evidence.

- `создание кампании`: мастер в `prototype.html` работает как локальная последовательность экранов, но шаги не опираются на реальный контракт создания кампании/импорта с обработкой ошибок. Для MVP Lab нужен API-backed flow, где каждый шаг валидируется сервером, а не только локально помечается статусом.
- `импорт`: в интерфейсе есть upload/mapping, но результаты показаны как локальные демо-значения (10 000/8 740/1 260), без привязки к `debtors/import` контракту и истории ошибок импорта в UI. Для Controlled Pilot это блокирует доверие к quality report.
- `мастер создания`: для каждого шага уже внедрены состояния `empty/loading/partial-success/error/review-required` в UI (`prototype.html`) и явные blocking/review причины по импорту, телеком-тесту, сценарной проверке; требуется API-backend нормализация статусов через реальные ответы `debtors/import`, `telephony-connections`, `scripts`, `calls/sandbox` до полного production parity.
- `readiness`: статусы readiness в overview/launch теперь имитируют прохождение проверок, хотя источники статусов пока не нормализованы по реальным сущностям (`DebtorRecord`, `ScriptVersion`, `TelephonyConnection`, `ComplianceDecision`, `CallAttempt`). Нужен единый "readiness source" и объяснение причин блокировки.
- `launch`: запуск меняет состояние только в UI (`tag run`), без обязательной проверки tenant/role gate и связанного backend перехода статуса кампании. В MVP Lab критичен связанный вызов backend-перехода и журнал аудита.
- `calls`: вкладка теперь опирается на API `GET /tenants/:tenantId/campaigns/:campaignId/calls` с явным источником (`live`/`демо`) и fallback на демо при ошибке API; добавлен drill-down через `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId` там, где доступен `callAttemptId`. Для записей без `callAttemptId` сохраняется оговорённый ограниченный режим карточки.
- `review`: в текущем прототипе отсутствует отдельная review-очередь; есть только косвенные пометки в сценарии и звонках. Для Controlled Pilot это уже обязательный UX-блок.
- `report`: часть вёрстки читается из API (`GET /tenants/:tenantId/campaigns/:campaignId/report`), но ряд метрик и drill-down по первичным событиям пока отсутствуют, а также нет связки отчёта с review actions и proof-evidence.

#### Разрывы по приоритету

**Блокирующие MVP Lab**

- `launch` не защищён backend-цепочкой `review -> running`, нет обязательного статуса кампании и обязательного audit-trail на каждом action запуск-останoвка.
- Не хватает proof-видимости перед запуском: где явно отражаются причины blocking (`consent`, `debt status`, `телефония`, `сценарий`) и какие следующие шаги нужны пользователю.
- Master flow не демонстрирует API-first ошибки импорта и валидаторов в inline формате, поэтому пользователь может получить false success без сохранения данных.
- `calls` view и карточка звонка не показывают единый proof bundle (`ComplianceDecision`, `callResult`, `usage events`) во всех кейсах, что снижает применимость audit-first подхода.

**Critical для Controlled Pilot**

- Отсутствует отдельная review queue с приоритизацией по рискам и SLA-индикаторам для спорных/flagged звонков.
- Нет обязательной привязки отчёта к первичным звонковым событиям и compliance-решениям, в том числе невозможен быстрый аудит по конкретному `ruleReason`.
- Нет операционного маршрута для ручного перевода в controlled handoff при нестандартных сценариях разговора.
- После автопаузы нет прозрачного flow resume и evidence-пакета для повторной активации кампании.

#### Рекомендуемый UX MVP-scope MVP Lab для закрытия T-065

1. Зафиксировать единственный источник `readiness` на основе backend-сущностей: `Campaign`, `DebtorRecord`, `ScriptVersion`, `TelephonyConnection`, `ComplianceDecision`, `CallAttempt`.
2. Стандартизовать статусы этапов (`draft`, `loading`, `ready`, `blocked`, `review`, `error`) в карточках так, чтобы пользователь видел, откуда статус (`source`) и что нужно сделать дальше.
3. Для всех ошибок импорта/launch/calls показывать путь к исправлению внутри того же потока, а не только визуально-статусный `toast`.
4. Для `calls` и `review` задать обязательный drill-down: от KPI и списка звонков → карточка (attempt/result/compliance/usage) → review item/агент/комплаенс-комментарий.

### 8.5. Вывод по текущей готовности

Технический backlog текущей волны почти закрыт: в `TECH_BACKLOG_1SP.md` завершены `63` задачи по состоянию на 16 августа 2026 года. Но по самому roadmap проект ещё не “почти готов”: он находится между поздним MVP Lab и ранней подготовкой к Controlled Pilot. Главный разрыв сместился с backend-фундамента на продуктовый пользовательский контур, операционные сценарии и compliance-first UX.

## 9. Рекомендация по следующему шагу

Не начинать с полного SaaS. Ближайший правильный шаг — MVP Lab для одного сегмента и одного клиента:

1. Зафиксировать legal-safe сценарий.
2. Собрать backend и модель событий.
3. Подключить один voice provider.
4. Запустить тестовые звонки без реального воздействия на должников.
5. Только после этого выходить в controlled pilot с holdout-группой и ежедневным QA.

Такой путь сохраняет сильную сторону текущего прототипа — понятный end-to-end процесс кампании — и закрывает главный разрыв до B2B SaaS: доказуемую безопасность, повторяемость и измеримую экономику.

## 10. Design Update (после отчета ревью, 16.08.2026)

### 1) What changed
- Зафиксирован единый блок доработок `P0/P1/P2` на базе отчета ревью.
- Разделены рисковые точки по категориям: `flow`, `states`, `roles`, `compliance`, `analytics`.
- Для всех критичных переходов добавлены требования к источнику состояния, объяснимым причинам и следующему шагу.
- Для каждой high-risk операции задана цепочка подтверждения и аудита.
- Добавлен отдельный список `Needs product decision` вместо подмены backend/PRD-логики UI-обещаниями.

### 2) Gaps closed
- **P0** Readiness теперь не может оставаться локальной имитацией: требуется единый `readinessSummary` с `source`, `timestamp`, `readinessHash`, `blocked`/`stale` и причинами.
- **P0** Launch переведен в высокорисковый backend transition: `draft/ready_for_review -> running` с role/actor gate и обязательным audit trail.
- **P1** Ролевые зоны ответственности зафиксированы: UI больше не показывает одинаковые действия для всех ролей, только RBAC-доступ.
- **P1** Импорт-цепочка закрыта по edge-cases: полная неудача импорта, partial success, quarantined rows, duplicate/invalid details и повторный import.
- **P1** Отчетность и KPI привязаны к источнику (`live`/`demo`) и первичным событиям; для каждой метрики указан path drill-down.
- **P1** Отчёт дополнен ролевой структурой (менеджер кампании, руководитель взыскания, compliance officer), разнесён по operational/business/risk-блокам и расширен drill-down в журнал звонков/QA/compliance review по первичным событиям.
- **P1** Разъехавшиеся статусы из roadmap/D-005…D-012 помечены: что в roadmap уже реализовано, что остается placeholder или API-backed.
- **P2** Глобальная review queue выделена как отдельное product решение: либо cross-campaign queue с SLA/overload, либо campaign-scoped fallback с явной заменой.

### 3) Updated flows
- `Import -> Validate -> Stale check -> Readiness proof`
  - **Entry:** создание кампании или новая загрузка базы.
  - **Key steps:** upload/report -> row-level errors/quarantine/duplicates -> повторная попытка или re-import -> freshness check.
  - **Exit state:** `readinessSummary` в состоянии `ready`/`blocked`/`stale` и конкретный следующий шаг.

- `Readiness -> Launch confirmation -> Controlled launch`
  - **Entry:** кампания в `draft`/`ready_for_review`.
  - **Key steps:** proof bundle (`importReport`, `telephonyProbeResult`, `scriptValidationReport`, `policyVersion`) -> blocking reasons -> explicit confirmation (actor/role).
  - **Exit state:** `running`, или `blocked`/`awaiting_confirmation`.

- `Running -> Risk event -> Auto-pause`
  - **Entry:** активная кампания с in-flight calls.
  - **Key steps:** risk code (`compliance`, `complaint`, `recording`, `provider`, `handoff`) -> reason/evidence -> остановка новых попыток.
  - **Exit state:** `auto_paused` или `stopped`.

- `Auto-pause/review -> Resume or Stop`
  - **Entry:** `auto_paused`/`review` с reasonCode и audit context.
  - **Key steps:** safe-resume checklist -> подтверждение owner/compliance -> запись audit transition.
  - **Exit state:** `running` / `stopped` (irreversible).

- `Risk call -> Handoff queue -> Human decision`
  - **Entry:** handoff/flag на уровне звонка или campaign rule.
  - **Key steps:** проверка owner/приоритета/overdue -> назначение reviewer -> approve/reject/escalate/requeue.
  - **Exit state:** `approved`, `escalated`, `requeued`.

- `Call completion -> Evidence capture -> QA`
  - **Entry:** завершение попытки.
  - **Key steps:** capture decision chain + transcript/recording availability -> QA annotation.
  - **Exit state:** `qa_pass`, `qa_flag`, `needs_recheck`.

- `Campaign stop/close` (manual)
  - **Entry:** manual stop request или incident.
  - **Key steps:** irreversible confirmation с consequences и альтернативным путём возобновления после закрытия причины.
  - **Exit state:** `stopped`.

- `Reporting -> Drill-down to evidence`
  - **Entry:** открытие отчета или KPI.
  - **Key steps:** filter scope + source + denominator; переход в calls/review/audit detail.
  - **Exit state:** traceable решение по конкретной единице риска/результата.

- `Audit detail chain`
  - **Entry:** пользователь кликает событие или review outcome.
  - **Key steps:** связать actor, source, before/after state, `ruleVersion`, `callAttemptId`, `complianceReason`.
  - **Exit state:** переход к следующему action или возврат в workflow.

### 4) States and edge cases
- Базовые состояния: `loading`, `empty`, `error`, `partial`, `blocked`, `review required`, `stale`, `auto-pause`, `stopped`, `no access`.
- Для мастера создания кампании зафиксировать единый контракт состояний:
  - шаги `campaign / import / telephony / script / readiness`,
  - поля `status`, `blockingReasons`, `nextActions`, `source` и `correlationId`,
  - обязательная трассировка `ready`/`partial`/`review`/`blocked`/`error` в причины действий (`Что сделать дальше?`) без «тихого» fallback к mock.
- Для launch: `draft`, `ready_for_review`, `awaiting_confirmation`, `running`, `running_with_warnings`.
- Для импорта: `bad_file`, `empty_file`, `row_errors`, `partial`, `quarantine`, `rejected`, `failed`, `stale_file`.
- Для review: `awaiting_assignment`, `handoff_queue_overload`, `expired`, `escalated`.
- Для отчета: `live` vs `demo`, `denominator_mismatch`.
- Для ошибок действий: launch/resume/review/QA backend failures with explicit retry/escalate path.
- Каждый state указывает «что делать дальше» (retry, re-import, re-check, request owner, escalate).

### 5) Role coverage
- `owner` / `collection_manager`: старт/стоп/резюмирование только при праве; видит risk dashboard и review-навигацию.
- `campaign_manager`: рабочие экраны кампании и мониторинг, без critical override в blocked/review без escalation.
- `compliance_officer`: полный доступ к decision chain, rule version, override с audit trail.
- `qa_analyst`: только QA-панель и разбор спорных звонков.
- `integration_admin`: только telephony/settings/health, без бизнес-решений запуска и compliance override.

### 6) Compliance / audit implications
- Обязательная цепочка доказательств: `campaign -> readinessSummary -> launchAttempt -> callAttempt -> complianceDecision -> review/QA -> state transition`.
- High-risk операторы (`launch`, `resume`, `stop`, `approve_review`, `escalate_review`) фиксируют actor/role/reasonCode/evidence/before-after state.
- Любой `blocked`/`auto-pause` должен объясняться и вести в action, а не маскироваться как обычная ошибка.
- Любые `demo`/fallback состояния помечены явно и не смешиваются с аудируемым live-источником.

### 7) Remaining open questions
- Какой legal rulebook и стоп-сценарии утверждены для v1.
- Какие точные stop conditions и thresholds автопаузы, и кто может resume.
- Подтверждение scope для manual contact add: v1/не v1 и fallback flow.
- Какой объект является `compliance_owner` для критических unblock решений.
- Что является обязательным KPI set и как формируется denominator.
- Нужна ли cross-campaign review queue в v1 или она остаётся campaign-scoped.

### 8) Final recommendation
- Передать блок `Design Update` в реализацию как контракт для следующего цикла.
- Сначала закрыть `Remaining open questions` как backend/PRD/legal решения, затем реализовывать 1 SP-дизайн-задачи по flow.
- Для каждого закрытого решения пересмотреть `ROADMAP_B2B_SAAS.md`/`TECH_BACKLOG_1SP.md` и обновить статус зависимости.
