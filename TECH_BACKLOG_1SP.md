# Technical Backlog: 1 SP Tasks

Дата: 19.08.2026

Каноническая очередь работ репозитория. UX/UI-задачи тоже живут здесь (`T-*`), не в отдельном файле. `DESIGN_BACKLOG_1SP.md` — архив закрытых дизайн-волн `D-001`–`D-013`.

Каждая задача = 1 story point и должна быть узкой: прочитать контекст, изменить файлы из «Где менять», проверить, обновить этот файл.

## Правила

- За проход брать **одну** задачу `todo` (если человек явно не попросил больше).
- После реализации: `done`, журнал, при необходимости новые `todo`.
- Слишком крупная → `split` и несколько новых 1 SP.
- `blocked` — только внешний договор, ключ, legal memo или доступ.
- Поля «Где менять» у открытых задач держать в актуальных путях (`src/`, `tests/`, `docs/`).
- Исторические id `T-065`/`T-066` встречаются дважды (API-docs и UX). Не перенумеровывать закрытое. Новые задачи — следующие свободные после последней `T-*` (сейчас `T-244+`).

## Статусы

- `todo` / `doing` / `done` / `blocked` / `split`

## Архитектура as-is (19.08.2026)

Стек: Node 20, TypeScript, Fastify, Prisma, PostgreSQL 16, Vitest. ADR: `0001` backend, `0002` SSO (ещё не код), `0003` Exolve+Mango, `0004` SpeechKit+YandexGPT/GigaChat, `0005` BYOK.

Есть в коде:

- Домен Lab: Tenant, User, Role, Session, Campaign, DebtorRecord, ScriptVersion, ComplianceDecision, TelephonyConnection, CallAttempt, CallResult, UsageEvent, AuditLog, SuppressionEntry, FrequencyLedger, ProviderCredential, PromptVersion, WebhookInboxEvent.
- API: кампании, CSV/XLSX-импорт, sandbox-звонок, отчёт, usage, QA, scripts, telephony connections, audit-logs, readiness-summary, review-items (вычисляемые), BYOK credentials, billing settings.
- Compliance pilot-ready (Lab): окно будни `08:00–22:00` / выходные и праздники РФ 2026–2027 `09:00–20:00` по timezone; `consent` given/pending/revoked; `debtStatus` block-список; `FREQUENCY_LIMIT_BLOCK` 1/2/8; `SUPPRESSION_BLOCK`; `Tenant.legalBasisStatus` (production без `confirmed` → `LEGAL_BASIS_NOT_CONFIRMED`). Fail-closed до звонка.
- Телефония: `VoiceProviderAdapter` + sandbox + скелеты Exolve/Mango (без HTTP). Production probe gates на marking/recording/handoff. Safe-resume: `POST .../safe-resume`.
- Речь/диалог (скелеты): ASR/TTS/LLM adapters + fake, Yandex/GigaChat skeleton без HTTP, BYOK envelope/store, DialogueStateMachine, extractor, golden set, identity gate в LLM tests.
- Platform: `docker-compose.yml` (PostgreSQL 16 + Redis), BullMQ skeleton + call jobs, fake object store, structured logger, webhook inbox idempotency, CI workflow.
- Auth: cookie-сессия `ac_session` (`POST /auth/register|login|logout`, `GET /auth/me`) + fallback заголовки `X-Tenant-Id` / `X-User-Role`. Rate limit + audit 429.
- UI: публичный вход `landing.html` / `register.html` / `login.html`; GitHub Pages отдаёт `public/index.html` (маркетинговый лендинг, не корневой `index.html`); `prototype.html` — клиентский кабинет CJ (`T-229`): меню Главная / Источники / Телефония / Аналитика / Журнал действий; вкладки Обзор · База · Сценарий · Телефония · Звонки. Частично API-backed (calls, report, readiness, audit-logs, список/создание кампаний, импорт); tenant/role после входа из `/auth/me`.
- Биллинг v0: connected minute из usage + тариф tenant/env.
- `Campaign.telephonyConnectionId`; `CallAttempt.scriptVersionId` на sandbox; identity slots `displayName`/`agreementRef`; маскировка телефона в audit metadata.

Нет в коде (разрыв до Controlled Pilot / Production):

- HTTP live Exolve (`T-149` blocked), HTTP SpeechKit/YandexGPT (`T-157` blocked), retention purge job (`T-203` blocked — ждёт legal memo).
- Маршрут `POST .../calls/live` (контракт в docs, guards есть, реализации нет).
- Runtime wiring orchestrator (ASR→state machine→LLM→TTS) в live/sandbox path end-to-end.
- CDR reconciliation, payment outcome / kept PTP, complaint rate, holdout/control для пилота.
- SSO/OIDC (только ADR 0002). Email/password web-auth есть (`T-244`); header-based режим сохранён как fallback.
- Клиентский кабинет как единый API-backed flow (волна 12: `T-232`–`T-238`).
- Admin-контур: речь/BYOK, внутренняя очередь QA (убран из клиентского меню в `T-229`).
- `npm run typecheck` — ~147 ошибок; CI красный на typecheck при зелёных тестах (`T-230`).

Карта: `docs/architecture/2026-08-17-technology-map.md`. Rulebook: `docs/compliance/rulebook-v1.md`. Live без legal memo и DPA не запускать.

### Внешние блокеры (не код, параллельно разработке)

- Legal memo: rulebook v1, 1/2/8, retention (152‑ФЗ vs 1,5 года), коллизия 126‑ФЗ / 230‑ФЗ по автовызовам.
- DPA и коммерция: Exolve (ADR 0003), Yandex Cloud Speech/GPT (ADR 0004).
- Baseline метрики пилота, beachhead-сегмент, владелец пилота у клиента.

## Очередь исполнения (открытое)

Не идти сверху файла: P0 закрыт. Брать первую `todo` из волны ниже.

1. **Lab hardening** — закрыта (`T-129`, `T-184`–`T-191`).
2. **Pre-dial pilot** — закрыта (`T-130`–`T-139`).
3. **Live telephony skeleton** — закрыта кроме HTTP Exolve = `T-149` blocked. Mango skeleton = `T-195`.
4. **Речь и ключи** — BYOK `T-162`–`T-180`, UI `T-181`–`T-183`, GigaChat `T-194`. Factory `T-176`. HTTP SpeechKit = `T-157` blocked.
5. **Диалог** — закрыта (`T-197`, `T-198`, `T-201`).
6. **Оркестратор** — закрыта (`T-158`–`T-160`).
7. **Evidence** — закрыта кроме retention = `T-203` blocked. `T-192`, `T-193`, `T-202` done.
8. **Adjacent** — закрыта (`T-196`, `T-199`, `T-200`, `T-204`). Logger `T-204` done.
9. **UX-волна кабинета (аудит 17.08.2026)** — закрыта (`T-205`–`T-228`).
10. **Кабинет клиента CJ (18.08.2026)** — закрыта (`T-229`). Спека `docs/superpowers/specs/2026-08-18-client-cabinet-cj-design.md`.
11. **Tech hygiene (19.08.2026)** — `T-230` (`done`), `T-231` (`done`).
12. **API-backed клиентский кабинет (19.08.2026)** — `T-232`–`T-238` (`done`).
13. **Controlled Pilot skeleton (19.08.2026)** — `T-239`–`T-243` (`done`).

Первая `todo`: нет.  
Blocked: `T-149` HTTP Exolve, `T-157` HTTP SpeechKit, `T-203` retention job — до legal memo и DPA.

## Закрытые волны (не переписывать)

`T-001`–`T-128` и дубли UX `T-065`–`T-072` / `T-161` — `done`. Ниже тела задач сохранены как история. Новые работы не добавлять внутрь закрытых P0-секций.

## P0. Подготовка технического контура

### T-001: Зафиксировать backend stack

Статус: `done`

Что сделать:

- Создать короткое архитектурное решение по backend stack, БД, ORM, тестам и локальному запуску.
- Объяснить, почему стек подходит для MVP Lab.
- Указать команды локального запуска и тестов.

Где менять:

- `docs/decisions/0001-backend-stack.md`
- при необходимости `README.md`

Критерии готовности:

- Есть явный выбранный backend stack.
- Есть выбранная БД.
- Есть команда запуска dev-сервера.
- Есть команда запуска тестов.

### T-002: Создать README для локальной разработки

Статус: `done`

Что сделать:

- Создать или обновить `README.md`.
- Описать назначение проекта.
- Описать текущие прототипы.
- Добавить раздел локального запуска.
- Добавить ссылку на roadmap и этот backlog.

Где менять:

- `README.md`

Критерии готовности:

- Новый разработчик понимает, что лежит в репозитории.
- Есть ссылки на `ROADMAP_B2B_SAAS.md` и `TECH_BACKLOG_1SP.md`.

### T-003: Создать базовую структуру backend
Статус: `done`

Что сделать:

- Создать минимальную структуру backend согласно выбранному стеку.
- Добавить healthcheck endpoint.
- Добавить базовую конфигурацию окружения.

Где менять:

- `package.json` или аналогичный файл зависимостей выбранного стека
- `src/server/*`
- `.env.example`

Критерии готовности:

- Dev-сервер стартует локально.
- Healthcheck возвращает успешный ответ.
- В `.env.example` перечислены обязательные переменные.

### T-004: Добавить минимальный тестовый контур
Статус: `done`

Что сделать:

- Настроить тестовый runner.
- Добавить тест для healthcheck endpoint.
- Добавить команду тестов в файл зависимостей.

Где менять:

- `package.json` или аналогичный файл зависимостей выбранного стека
- `src/server/*`
- `tests/*`

Критерии готовности:

- Команда тестов запускается.
- Есть минимум один проходящий тест.

## P0. Доменная модель

### T-005: Описать доменную модель MVP Lab

Статус: `done`

Что сделать:

- Описать сущности `Tenant`, `User`, `Role`, `Campaign`, `DebtorRecord`, `CallAttempt`, `CallResult`, `ScriptVersion`, `ComplianceDecision`, `TelephonyConnection`, `UsageEvent`.
- Для каждой сущности указать назначение и ключевые поля.
- Указать связи между сущностями.

Где менять:

- `docs/domain-model.md`

Критерии готовности:

- Все P0-сущности описаны.
- Для каждой сущности есть первичный ключ и `tenantId`, если сущность tenant-scoped.

### T-006: Создать ERD доменной модели

Статус: `done`

Что сделать:

- Добавить Mermaid ERD по сущностям MVP Lab.
- Отразить связи tenant -> users/campaigns, campaign -> debtor records/call attempts, call attempt -> result/compliance decisions/usage events.

Где менять:

- `docs/domain-model.md`

Критерии готовности:

- В документе есть Mermaid ERD.
- ERD соответствует списку сущностей.

### T-007: Создать схему Tenant

Статус: `done`

Что сделать:

- Добавить модель/таблицу `Tenant`.
- Поля: `id`, `name`, `status`, `createdAt`, `updatedAt`.
- Добавить миграцию или схему БД согласно выбранному стеку.

Где менять:

- `src/db/*`
- `src/domain/tenant*`
- `tests/*`

Критерии готовности:

- Схема содержит `Tenant`.
- Есть тест или проверка миграции.

### T-008: Создать схему User и Role

Статус: `done`

Что сделать:

- Добавить модели/таблицы `User` и `Role`.
- Связать пользователя с tenant.
- Связать роль с пользователем.

Где менять:

- `src/db/*`
- `src/domain/user*`
- `src/domain/role*`
- `tests/*`

Критерии готовности:

- Пользователь не может существовать без tenant.
- Роль пользователя явно хранится или выводится из связи.

### T-009: Создать схему Campaign

Статус: `done`

Что сделать:

- Добавить модель/таблицу `Campaign`.
- Поля: `id`, `tenantId`, `name`, `status`, `timezone`, `createdByUserId`, `createdAt`, `updatedAt`.
- Ограничить `status` допустимыми значениями: `draft`, `review`, `ready`, `running`, `auto_paused`, `completed`, `archived`.

Где менять:

- `src/db/*`
- `src/domain/campaign*`
- `tests/*`

Критерии готовности:

- Campaign всегда принадлежит tenant.
- Нельзя сохранить неизвестный статус кампании.

### T-010: Создать схему DebtorRecord

Статус: `done`

Что сделать:

- Добавить модель/таблицу `DebtorRecord`.
- Поля: `id`, `tenantId`, `campaignId`, `externalId`, `phone`, `timezone`, `debtAmount`, `debtStatus`, `consentStatus`, `createdAt`, `updatedAt`.
- Добавить уникальность `tenantId + campaignId + externalId`.

Где менять:

- `src/db/*`
- `src/domain/debtor-record*`
- `tests/*`

Критерии готовности:

- Запись должника привязана к tenant и campaign.
- Повторный `externalId` в одной кампании не создает дубль.

### T-011: Создать схему ScriptVersion

Статус: `done`

Что сделать:

- Добавить модель/таблицу `ScriptVersion`.
- Поля: `id`, `tenantId`, `campaignId`, `version`, `status`, `content`, `createdByUserId`, `createdAt`.
- Добавить уникальность `campaignId + version`.

Где менять:

- `src/db/*`
- `src/domain/script-version*`
- `tests/*`

Критерии готовности:

- У кампании может быть несколько версий сценария.
- Версии не перезаписываются.

### T-012: Создать схему ComplianceDecision

Статус: `done`

Что сделать:

- Добавить модель/таблицу `ComplianceDecision`.
- Поля: `id`, `tenantId`, `campaignId`, `debtorRecordId`, `decision`, `reasonCode`, `reasonText`, `ruleVersion`, `checkedAt`.
- Ограничить `decision` значениями `allow` и `block`.

Где менять:

- `src/db/*`
- `src/domain/compliance-decision*`
- `tests/*`

Критерии готовности:

- Каждая проверка compliance сохраняется как отдельная запись.
- Причина решения обязательна.

### T-013: Создать схему TelephonyConnection

Статус: `done`

Что сделать:

- Добавить модель/таблицу `TelephonyConnection`.
- Поля: `id`, `tenantId`, `provider`, `mode`, `status`, `displayName`, `createdAt`, `updatedAt`.
- Не хранить секреты напрямую в модели.

Где менять:

- `src/db/*`
- `src/domain/telephony-connection*`
- `.env.example`
- `tests/*`

Критерии готовности:

- Есть место для sandbox-подключения провайдера.
- В модели нет plain-text секретов.

### T-014: Создать схемы CallAttempt и CallResult

Статус: `done`

Что сделать:

- Добавить модели/таблицы `CallAttempt` и `CallResult`.
- `CallAttempt`: `id`, `tenantId`, `campaignId`, `debtorRecordId`, `status`, `startedAt`, `endedAt`, `providerCallId`.
- `CallResult`: `id`, `tenantId`, `callAttemptId`, `outcome`, `ptpAmount`, `ptpDate`, `reason`, `transcriptUrl`, `recordingUrl`.

Где менять:

- `src/db/*`
- `src/domain/call-attempt*`
- `src/domain/call-result*`
- `tests/*`

Критерии готовности:

- Результат звонка связан с конкретной попыткой.
- Звонок связан с tenant, campaign и debtor record.

### T-015: Создать схему UsageEvent

Статус: `done`

Что сделать:

- Добавить модель/таблицу `UsageEvent`.
- Поля: `id`, `tenantId`, `campaignId`, `eventType`, `quantity`, `unit`, `sourceId`, `occurredAt`.
- Добавить уникальность для защиты от повторной записи одного provider event.

Где менять:

- `src/db/*`
- `src/domain/usage-event*`
- `tests/*`

Критерии готовности:

- Usage event можно связать с кампанией.
- Повтор события с тем же `sourceId` не задваивает usage.

  

## P0. API кампаний

### T-016: Создать API создания кампании

Статус: `done`

Что сделать:

- Добавить endpoint создания кампании.
- Принимать `tenantId`, `name`, `timezone`.
- Создавать кампанию в статусе `draft`.

Где менять:

- `src/server/routes/campaigns*`
- `src/domain/campaign*`
- `tests/*`

Критерии готовности:

- Endpoint возвращает созданную кампанию.
- Нельзя создать кампанию без tenant.

### T-017: Создать API списка кампаний tenant

Статус: `done`

Что сделать:

- Добавить endpoint получения списка кампаний по tenant.
- Возвращать `id`, `name`, `status`, `timezone`, `createdAt`.

Где менять:

- `src/server/routes/campaigns*`
- `src/domain/campaign*`
- `tests/*`

Критерии готовности:

- Endpoint не возвращает кампании других tenant.
- Список отсортирован по дате создания.

### T-018: Создать API карточки кампании

Статус: `done`

Что сделать:

- Добавить endpoint получения одной кампании.
- Вернуть основные поля кампании и агрегаты: число debtor records, число call attempts, число compliance blocks.

Где менять:

- `src/server/routes/campaigns*`
- `src/domain/campaign*`
- `tests/*`

Критерии готовности:

- Endpoint возвращает `404`, если кампания не найдена.
- Агрегаты считаются из данных, а не из моков.

### T-019: Создать API смены статуса кампании

Статус: `done`

Что сделать:

- Добавить endpoint смены статуса кампании.
- Разрешить только валидные переходы: `draft -> review`, `review -> ready`, `ready -> running`, `running -> auto_paused`, `running -> completed`, `auto_paused -> review`, `completed -> archived`.

Где менять:

- `src/server/routes/campaigns*`
- `src/domain/campaign-status*`
- `tests/*`

Критерии готовности:

- Невалидный переход возвращает ошибку.
- Валидный переход сохраняется.

## P0. Импорт базы

### T-020: Описать data contract CSV

Статус: `done`

Что сделать:

- Описать минимальный формат CSV для импорта базы.
- Указать обязательные поля: `externalId`, `phone`, `timezone`, `debtAmount`, `debtStatus`, `consentStatus`.
- Добавить пример валидного CSV.

Где менять:

- `docs/data-contracts/debtor-import-csv.md`
- `fixtures/import/debtors-valid.csv`

Критерии готовности:

- Документ содержит поля, типы и пример.
- Пример можно использовать в тестах.

### T-021: Добавить CSV parser для debtor import

Статус: `done`

Что сделать:

- Реализовать чтение CSV файла debtor import.
- Вернуть массив сырых строк без записи в БД.
- Обработать пустой файл как ошибку.

Где менять:

- `src/import/debtor-import-parser*`
- `tests/import/*`

Критерии готовности:

- Валидный CSV читается.
- Пустой CSV возвращает понятную ошибку.

### T-022: Добавить валидацию обязательных полей импорта

Статус: `done`

Что сделать:

- Проверять наличие всех обязательных колонок.
- Проверять заполненность обязательных значений.
- Возвращать список ошибок по строкам.

Где менять:

- `src/import/debtor-import-validator*`
- `tests/import/*`

Критерии готовности:

- CSV без обязательной колонки не проходит.
- Ошибки указывают номер строки и поле.

### T-023: Добавить нормализацию телефона

Статус: `done`

Что сделать:

- Добавить нормализацию телефона к единому формату.
- Невалидные телефоны отправлять в ошибки импорта.

Где менять:

- `src/import/phone-normalizer*`
- `tests/import/*`

Критерии готовности:

- Телефоны с пробелами, скобками и дефисами нормализуются.
- Невалидный телефон не попадает в import result как успешный.

### T-024: Добавить дедупликацию строк импорта

Статус: `done`

Что сделать:

- Дедуплицировать строки по `externalId` внутри одного файла.
- Повторные строки помечать как rejected.

Где менять:

- `src/import/debtor-import-validator*`
- `tests/import/*`

Критерии готовности:

- Дубликаты не записываются как отдельные debtor records.
- В отчете импорта видна причина отклонения.

### T-025: Создать API импорта debtor records

Статус: `done`

Что сделать:

- Добавить endpoint загрузки CSV в кампанию.
- Сохранять валидные строки как `DebtorRecord`.
- Возвращать quality report: `acceptedCount`, `rejectedCount`, `errors`.

Где менять:

- `src/server/routes/import*`
- `src/import/*`
- `src/domain/debtor-record*`
- `tests/*`

Критерии готовности:

- Валидные строки сохраняются.
- Невалидные строки не сохраняются.
- Ответ содержит quality report.

## P0. Compliance engine

### T-026: Создать интерфейс compliance rule

Статус: `done`

Что сделать:

- Добавить общий интерфейс правила compliance.
- Правило должно принимать контекст звонка и возвращать `allow` или `block` с причиной.

Где менять:

- `src/compliance/rules*`
- `tests/compliance/*`

Критерии готовности:

- Можно написать новое правило без изменения engine.
- Тестовый fake rule выполняется через общий интерфейс.

### T-027: Добавить правило времени звонка

Статус: `done`

Что сделать:

- Добавить правило, которое блокирует звонок вне разрешенного окна tenant/campaign timezone.
- На старт использовать конфиг по умолчанию `08:00-22:00`.

Где менять:

- `src/compliance/rules/call-window*`
- `tests/compliance/*`

Критерии готовности:

- Звонок внутри окна разрешается.
- Звонок вне окна блокируется с reason code.

### T-028: Добавить правило consentStatus

Статус: `done`

Что сделать:

- Добавить правило, которое блокирует звонок, если `consentStatus = revoked`.
- Для остальных статусов возвращать allow.

Где менять:

- `src/compliance/rules/consent-status*`
- `tests/compliance/*`

Критерии готовности:

- Revoked consent блокирует звонок.
- Причина блокировки сохраняет machine-readable code.

### T-029: Добавить правило debtStatus

Статус: `done`

Что сделать:

- Добавить правило, которое блокирует звонок при статусах `closed`, `disputed`, `bankruptcy`, `contact_forbidden`.
- Для активного долга возвращать allow.

Где менять:

- `src/compliance/rules/debt-status*`
- `tests/compliance/*`

Критерии готовности:

- Закрытый или спорный долг блокируется.
- Активный долг проходит проверку.

### T-030: Собрать compliance engine v1

Статус: `done`

Что сделать:

- Реализовать engine, который запускает набор правил.
- Если любое правило возвращает block, итоговое решение `block`.
- Сохранять все причины блокировки.

Где менять:

- `src/compliance/engine*`
- `tests/compliance/*`

Критерии готовности:

- Engine возвращает итоговое решение.
- Engine возвращает список сработавших правил.

### T-031: Сохранять compliance decision log

Статус: `done`

Что сделать:

- После проверки compliance сохранять запись `ComplianceDecision`.
- Сохранять `decision`, `reasonCode`, `reasonText`, `ruleVersion`, `checkedAt`.

Где менять:

- `src/compliance/engine*`
- `src/domain/compliance-decision*`
- `tests/compliance/*`

Критерии готовности:

- Каждая проверка создает запись в логе.
- В записи достаточно данных, чтобы объяснить решение.

### T-032: Создать API проверки compliance для debtor record

Статус: `done`

Что сделать:

- Добавить endpoint ручной проверки compliance для одного debtor record.
- Возвращать итоговое решение и причины.
- Сохранять decision log.

Где менять:

- `src/server/routes/compliance*`
- `src/compliance/*`
- `tests/*`

Критерии готовности:

- Endpoint можно вызвать для debtor record.
- Результат проверки сохраняется.

## P0. Voice provider sandbox

### T-033: Описать контракт voice provider adapter

Статус: `done`

Что сделать:

- Описать интерфейс adapter для voice provider.
- Методы: `startCall`, `getCallStatus`, `hangupCall`.
- Описать ожидаемые статусы звонка.

Где менять:

- `docs/integrations/voice-provider-adapter.md`
- `src/telephony/voice-provider*`

Критерии готовности:

- Понятно, как подключать реального провайдера.
- Интерфейс не зависит от конкретного vendor.

### T-034: Создать sandbox voice provider

Статус: `done`

Что сделать:

- Реализовать fake/sandbox adapter.
- `startCall` должен возвращать стабильный `providerCallId`.
- Статус звонка должен быть предсказуемым для тестов.

Где менять:

- `src/telephony/sandbox-provider*`
- `tests/telephony/*`

Критерии готовности:

- Можно создать тестовый звонок без внешней телефонии.
- Тесты не требуют сетевого доступа.

### T-035: Создать API sandbox звонка

Статус: `done`

Что сделать:

- Добавить endpoint запуска sandbox звонка по debtor record.
- Перед стартом обязательно вызывать compliance engine.
- Если compliance block, звонок не стартует.

Где менять:

- `src/server/routes/calls*`
- `src/telephony/*`
- `src/compliance/*`
- `tests/*`

Критерии готовности:

- Allowed debtor record создает `CallAttempt`.
- Blocked debtor record не создает внешний звонок и возвращает причину.

### T-036: Сохранять результат sandbox звонка

Статус: `done`

Что сделать:

- После sandbox звонка создавать `CallResult`.
- Заполнять `outcome`, `reason`, `transcriptUrl`, `recordingUrl` тестовыми значениями.

Где менять:

- `src/server/routes/calls*`
- `src/domain/call-result*`
- `tests/*`

Критерии готовности:

- У завершенного sandbox звонка есть результат.
- Результат связан с `CallAttempt`.


## P0. Отчеты из событий

### T-037: Добавить usage event при sandbox звонке

Статус: `done`

Что сделать:

- При создании sandbox звонка сохранять `UsageEvent` типа `call_started`.
- При завершении sandbox звонка сохранять `UsageEvent` типа `call_completed`.


Где менять:

- `src/telephony/*`
- `src/domain/usage-event*`
- `tests/*`

Критерии готовности:

- Usage events создаются из реальных действий.
- Повторная обработка одного события не создает дубль.

### T-038: Создать сервис агрегатов отчета кампании

Статус: `done`

Что сделать:

- Добавить сервис, который считает отчет кампании из `CallAttempt`, `CallResult`, `ComplianceDecision`, `UsageEvent`.
- Метрики: total records, attempted calls, completed calls, blocked calls, ptp count.

Где менять:

- `src/reports/campaign-report*`
- `tests/reports/*`

Критерии готовности:

- Сервис не использует моковые числа.
- Метрики совпадают с подготовленными тестовыми данными.

### T-039: Создать API отчета кампании

Статус: `done`

Что сделать:

- Добавить endpoint отчета кампании.
- Возвращать агрегаты из report service.

Где менять:

- `src/server/routes/reports*`
- `src/reports/*`
- `tests/*`

Критерии готовности:

- Endpoint возвращает отчет по конкретной кампании.
- Данные отчета считаются из БД/событий.

### T-040: Подключить prototype report к API

Статус: `done`

Что сделать:

- Найти в `prototype.html` блок отчета с моковыми цифрами.
- Заменить источник данных на вызов report API.
- Добавить fallback-состояние, если API недоступен.

Где менять:

- `prototype.html`
- при необходимости `src/server/routes/reports*`

Критерии готовности:

- Отчет в прототипе берет данные из API.
- При недоступном API пользователь видит понятное состояние.

## P1. RBAC и audit log

### T-041: Описать роли MVP Lab

Статус: `done`

Что сделать:

- Описать роли: owner, collection_manager, operator, qa_analyst, compliance_officer, integration_admin.
- Для каждой роли описать минимальные права.

Где менять:

- `docs/security/rbac.md`

Критерии готовности:

- Есть матрица роль -> действие.
- Роли соответствуют roadmap.

### T-042: Добавить middleware tenant context

Статус: `done`

Что сделать:

- Добавить middleware, который извлекает tenant из запроса.
- На MVP можно использовать заголовок `X-Tenant-Id`.
- Отклонять запросы без tenant.

Где менять:

- `src/server/middleware/tenant-context*`
- `tests/*`

Критерии готовности:

- Endpoint получает tenant context.
- Запрос без tenant возвращает ошибку.

### T-043: Добавить простой RBAC middleware

Статус: `done`

Что сделать:

- Добавить middleware проверки роли пользователя.
- На MVP можно использовать заголовок `X-User-Role`.
- Защитить минимум один write endpoint.

Где менять:

- `src/server/middleware/rbac*`
- `src/server/routes/*`
- `tests/*`

Критерии готовности:

- Разрешенная роль проходит.
- Запрещенная роль получает ошибку доступа.

- Для `POST /campaigns` разрешены роли `owner` и `collection_manager`.

### T-044: Создать схему AuditLog

Статус: `done`

Что сделать:

- Добавить модель/таблицу `AuditLog`.
- Поля: `id`, `tenantId`, `userId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`.

Где менять:

- `src/db/*`
- `src/domain/audit-log*`
- `tests/*`

Критерии готовности:

- AuditLog tenant-scoped.
- Metadata хранится структурно.
- Модель поддерживает запись действия, типа и идентификатора сущности (`action`, `entityType`, `entityId`) с `tenantId` и `userId`.

### T-045: Логировать создание кампании в AuditLog

Статус: `done`

Что сделать:

- При создании кампании записывать audit event.
- Сохранять пользователя, tenant, действие `campaign.created`.

Где менять:

- `src/server/routes/campaigns*`
- `src/domain/audit-log*`
- `tests/*`

Критерии готовности:

- Создание кампании оставляет audit trail.
- Тест проверяет audit event.

## P1. Журнал звонков и QA

### T-046: Создать API списка звонков кампании

Статус: `done`

Что сделать:

- Добавить endpoint списка `CallAttempt` по кампании.
- Возвращать статус, debtor externalId, startedAt, endedAt, outcome.

Где менять:

- `src/server/routes/calls*`
- `src/domain/call-attempt*`
- `tests/*`

Критерии готовности:

- Список не содержит звонки других tenant.
- Звонки отсортированы по дате старта.

### T-047: Создать API карточки звонка

Статус: `done`

Что сделать:

- Добавить endpoint одного звонка.
- Вернуть attempt, result, compliance decisions, usage events.

Где менять:

- `src/server/routes/calls*`
- `tests/*`

Критерии готовности:

- Карточка показывает полный технический след звонка.
- При неизвестном звонке возвращается `404`.

### T-048: Добавить QA status к CallResult

Статус: `done`

Что сделать:

- Добавить поле `qaStatus` к `CallResult`.
- Значения: `not_reviewed`, `approved`, `flagged`.
- По умолчанию ставить `not_reviewed`.

Где менять:

- `src/db/*`
- `src/domain/call-result*`
- `tests/*`

Критерии готовности:

- Новый результат звонка получает `qaStatus = not_reviewed`.
- Нельзя сохранить неизвестный QA status.

### T-049: Создать API QA-разметки звонка

Статус: `done`

Что сделать:

- Добавить endpoint изменения `qaStatus`.
- Разрешить статусы `approved` и `flagged`.
- Записывать audit event `call.qa_updated`.

Где менять:

- `src/server/routes/qa*`
- `src/domain/call-result*`
- `src/domain/audit-log*`
- `tests/*`

Критерии готовности:

- QA status обновляется.
- Действие попадает в audit log.

## P1. Версионирование сценариев

### T-050: Создать API создания версии сценария

Статус: `done`

Что сделать:

- Добавить endpoint создания `ScriptVersion` для кампании.
- Новая версия должна получать следующий номер.
- После создания версии переводить кампанию в `review`.

Где менять:

- `src/server/routes/scripts*`
- `src/domain/script-version*`
- `src/domain/campaign*`
- `tests/*`

Критерии готовности:

- Версии создаются последовательно.
- Изменение сценария требует повторной проверки.

### T-051: Создать API списка версий сценария

Статус: `done`

Что сделать:

- Добавить endpoint списка `ScriptVersion` по кампании.
- Возвращать `version`, `status`, `createdAt`, `createdByUserId`.

Где менять:

- `src/server/routes/scripts*`
- `tests/*`

Критерии готовности:

- Список версий отсортирован по номеру версии.
- Данные изолированы по tenant.

## P1. Автопауза

### T-052: Описать причины автопаузы

Статус: `done`

Что сделать:

- Описать reason codes автопаузы: `compliance_violation`, `complaint_spike`, `recording_failed`, `handoff_overloaded`, `provider_sla_failed`.
- Указать, какие события могут запускать автопаузу.

Где менять:

- `docs/operations/auto-pause.md`

Критерии готовности:

- Есть список reason codes.
- Есть объяснение, что делать после автопаузы.

### T-053: Добавить сервис автопаузы кампании

Статус: `done`

Что сделать:

- Добавить сервис, который переводит кампанию в `auto_paused`.
- Сохранять reason code и audit event.

Где менять:

- `src/domain/campaign-auto-pause*`
- `src/domain/audit-log*`
- `tests/*`

Критерии готовности:

- Running campaign можно автопоставить на паузу.
- Причина автопаузы сохраняется.

## P1. Usage ledger

### T-054: Создать API usage ledger кампании

Статус: `done`

Что сделать:

- Добавить endpoint списка `UsageEvent` по кампании.
- Возвращать event type, quantity, unit, occurredAt.

Где менять:

- `src/server/routes/usage*`
- `src/domain/usage-event*`
- `tests/*`

Критерии готовности:

- Usage events доступны по кампании.
- Данные tenant-isolated.

## P2. Enterprise readiness

### T-055: Добавить агрегаты usage ledger

Статус: `done`

Что сделать:

- Добавить сервис агрегирования usage по типу события и unit.
- Вернуть totals для кампании.

Где менять:

- `src/domain/usage-ledger*`
- `src/server/routes/usage*`
- `tests/usage.api.test.ts`

Критерии готовности:

- Aggregates считаются из `UsageEvent`.
- Дубли source events не влияют на totals.

### T-056: Создать decision doc по SSO

Статус: `done`

Что сделать:

- Описать будущий SSO-подход: SAML или OIDC.
- Указать, что в MVP Lab используется заголовочная mock-auth только для локальной разработки.

Где менять:

- `docs/decisions/0002-sso-approach.md`

Критерии готовности:

- Понятно, как MVP-auth будет заменяться enterprise-auth.

### T-057: Описать API integration contract

Статус: `done`

Что сделать:

- Описать будущие интеграции API/SFTP/webhooks.
- Зафиксировать idempotency key для входящих событий.

Где менять:

- `docs/integrations/external-systems.md`

Критерии готовности:

- Есть список поддерживаемых направлений интеграции.
- Idempotency описана явно.

### T-058: Описать billing model v0

Статус: `done`

Что сделать:

- Описать billing units: connected minute, successful dialog, storage.
- Указать, какие `UsageEvent` входят в billing v0.

Где менять:

- `docs/billing/billing-model-v0.md`

Критерии готовности:

- Usage ledger можно связать с будущим биллингом.

### T-059: Описать second voice provider extension point

Статус: `done`

Что сделать:

- Описать, как добавить второго telecom provider через существующий adapter interface.
- Указать, какие vendor-specific поля нельзя протаскивать в домен.

Где менять:

- `docs/integrations/voice-provider-adapter.md`

Критерии готовности:

- Документ объясняет добавление второго provider без переписывания orchestrator.

### T-060: Описать on-prem/private cloud assessment

Статус: `done`

Что сделать:

- Создать чеклист оценки on-prem/private cloud.
- Включить данные, секреты, телефонию, storage, observability, updates.

Где менять:

- `docs/enterprise/on-prem-assessment.md`

Критерии готовности:

- Есть список вопросов для enterprise discovery.

## P2. Управление телефонией

### T-061: Создать API списка и создания TelephonyConnection

Статус: `done`

Что сделать:

- Добавить endpoint для списка `TelephonyConnection` по `tenantId`.
- Добавить endpoint для создания `TelephonyConnection` с валидацией и tenant isolation.
- Возвращать только tenant-scoped поля в ответах API.

Где менять:

- `src/routes/telephony.ts`
- `src/server/app.ts`
- `tests/telephony.routes.test.ts`

Критерии готовности:

- `GET /tenants/:tenantId/telephony-connections` возвращает все подключения tenant.
- `POST /tenants/:tenantId/telephony-connections` создаёт подключение только для существующего tenant.
- На ошибках валидации и неверной tenant-связи возвращаются корректные коды/ошибки.

### T-062: Добавить audit trail на создание TelephonyConnection

Статус: `done`

Что сделать:

- Добавить обязательную проверку активного пользователя tenant при создании telephony connection.
- При `POST /tenants/:tenantId/telephony-connections` добавить запись в AuditLog (`telephony_connection.created`).
- Добавить тест на запись audit события и на 422 при отсутствии активного пользователя.

Где менять:

- `src/routes/telephony.ts`
- `src/server/app.ts`
- `tests/telephony.routes.test.ts`

Критерии готовности:

- В `POST /tenants/:tenantId/telephony-connections` запрос не проходит без активного пользователя tenant.
- При успешном создании telephony connection пишется `action=telephony_connection.created` в `AuditLog`.

### T-063: Добавить role-based доступ к telephony API

Статус: `done`

Что сделать:

- Защитить `POST /tenants/:tenantId/telephony-connections` ролью (например, `owner`/`integration_admin`).
- Зафиксировать проверку доступа в тестах.
- Не менять текущую логику tenant isolation и audit trail.

Где менять:

- `src/routes/telephony.ts`
- `tests/telephony.routes.test.ts`

Критерии готовности:

- Запросы без нужной роли для создания подключения возвращают 403.
- Доступ к `GET /tenants/:tenantId/telephony-connections` сохранился для авторизованных пользователей согласно роли/политике.

### T-064: Добавить route-level документацию для telephony API

Статус: `done`

Что сделать:

- Добавить короткий API-фрагмент в документацию (помощник/договоренности по ролям и payload).
- Зафиксировать ожидаемые коды ответов (`401`, `403`, `404`, `422`) и структуру ошибки.

Где менять:

- `docs/telephony-api.md`

Критерии готовности:

- Есть актуальное описание `GET/POST /tenants/:tenantId/telephony-connections`.
- Описаны ограничения ролей и tenant isolation.

### T-065: Добавить route-level документацию для calls API

Статус: `done`

Что сделать:

- Добавить короткий API-фрагмент для `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`.
- Добавить документацию для `GET /tenants/:tenantId/campaigns/:campaignId/calls` и `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`.

Где менять:

- `docs/calls-api.md`

Критерии готовности:

- Зафиксированы коды ответов и структуры успешных/ошибочных ответов для 3 endpoints.
- Отражено, что sandbox запуск идёт через compliance engine и tenant isolation.

### T-066: Увязать API-документацию с обзорным docs index

Статус: `done`

Что сделать:

- Добавить раздел в `README.md` с ссылками на `docs/telephony-api.md` и `docs/calls-api.md`.
- Кратко указать, что это route-level контракты MVP и для чего они применяются.

Где менять:

- `README.md`

Критерии готовности:

- В `README.md` есть ссылка на route-level документы по API.
- Документирование не меняет поведение API-реестра.

## P1. Дизайн и пользовательский flow

### T-065: Провести UX-аудит основного пути кампании

Статус: `done`

Что сделать:

- Сопоставить текущий `prototype.html` и реализованные API с каноническим flow `создание кампании -> импорт -> readiness -> launch -> calls -> review -> report`.
- Зафиксировать разрывы между backend-возможностями и текущим интерфейсом.
- Выделить критичные UX-пробелы для MVP Lab и Controlled Pilot.

Где менять:

- `ROADMAP_B2B_SAAS.md`
- `docs/product/prd-open-questions.md`

Критерии готовности:

- Есть список ключевых UX-gap между прототипом и текущей backend-реализацией.
- Для каждого gap понятно, мешает ли он MVP Lab или уже относится к Controlled Pilot.

### T-066: Описать IA и навигацию операторского кабинета MVP

Статус: `done`

Что сделать:

- Зафиксировать разделы и уровни навигации для ролей `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Определить, какие сущности и действия должны жить внутри кампании, а какие требуют глобального раздела.
- Сформулировать канонический sidebar/top-level navigation для MVP.

Где менять:

- `docs/product/prd-open-questions.md`
- `prototype.html`

Критерии готовности:

- Для основных ролей понятна точка входа в ежедневную работу.
- Навигация не дублирует один и тот же объект в нескольких несвязанных местах.

### T-067: Спроектировать screen states для мастера создания кампании

Статус: `done`

Что сделать:

- Описать empty/loading/error/partial-success/review-required состояния для шагов создания кампании.
- Выделить обязательные blocking reasons для импорта базы, телефонии, сценария и readiness check.
- Подготовить изменения в прототипе мастера под реальные backend-ответы.

Где менять:

- `prototype.html`
- `ROADMAP_B2B_SAAS.md`

Критерии готовности:

- Мастер не опирается только на happy path.
- Для каждого шага понятны действия пользователя после ошибки или частичного успеха.

### T-068: Спроектировать экран readiness и controlled launch

Статус: `done`

Что сделать:

- Описать структуру readiness checklist перед запуском кампании.
- Разделить состояния `готово`, `нужна проверка`, `автопауза`, `заблокировано compliance`, `ожидает подтверждения`.
- Определить, какие evidence и причины пользователь должен видеть до запуска.

Где менять:

- `prototype.html`
- `docs/operations/auto-pause.md`

Критерии готовности:

- Пользователь понимает, можно ли запускать кампанию сейчас и почему.
- Причина блокировки или review видна без перехода по нескольким экранам.

### T-069: Спроектировать очередь review и compliance-разбор

Статус: `done`

Что сделать:

- Описать отдельный flow для review items, compliance blocks и handoff.
- Определить состав таблицы, фильтры, приоритеты и карточку review item.
- Развести технические события, compliance decision log и пользовательские action items.

Где менять:

- `prototype.html`
- `docs/security/rbac.md`

Критерии готовности:

- Reviewer может принять решение без поиска контекста по нескольким экранам.
- Очередь review не смешивается с общим журналом звонков.

### T-070: Спроектировать карточку звонка и QA-проход

Статус: `done`

Что сделать:

- Описать canonical layout карточки звонка: статус, outcome, compliance decision, transcript, recording, timeline, QA decision.
- Определить, какие элементы должны быть доступны в inline-review, а какие только в полной карточке.
- Подготовить прототип под реальный QA workflow вместо демонстрационного сценария.

Где менять:

- `prototype.html`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Карточка звонка поддерживает QA и compliance-разбор в одном контексте.
- Пользователь может понять источник outcome и статус ручной проверки.

### T-071: Спроектировать flow автопаузы и безопасного возобновления

Статус: `done`

Что сделать:

- Описать UX-сценарий для `campaign.auto_paused`, включая причину, impact, required action и audit trail.
- Развести ручную паузу, автопаузу и окончательную остановку кампании.
- Зафиксировать условия и экран подтверждения для resume после risk-события.

Где менять:

- `prototype.html`
- `docs/operations/auto-pause.md`

Критерии готовности:

- Автопауза не выглядит как обычная техническая ошибка.
- Возобновление после risk-события не является случайным одношаговым действием.

### T-072: Спроектировать отчёт и drill-down по evidence

Статус: `done`

Что сделать:

- Определить структуру отчёта кампании для ролей менеджера, supervisor и compliance officer.
- Добавить drill-down от KPI к журналу звонков, блокировкам compliance и QA-исключениям.
- Развести operational metrics, business outcomes и risk/compliance metrics в UI.

Где менять:

- `prototype.html`
- `ROADMAP_B2B_SAAS.md`

Критерии готовности:

- Отчёт помогает принимать решение, а не только показывает агрегаты.
- У каждой ключевой метрики есть понятный путь к первичным событиям.

### T-073: Исправить audit-logs контракт и согласовать payload аудита звонков

Статус: `done`

Что сделать:

- Исправить валидацию маршрута `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`, чтобы он корректно работал с контрактным форматом `campaignId`.
- Согласовать ожидаемый `auditLog` payload для сценариев `call.qa_updated`, `call.sandbox_started`, `call.sandbox_blocked` с фактическим поведением маршрутов.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- `audit-logs` API корректно обрабатывает `campaignId` из контракта и не отклоняет его по ошибке валидации.
- Проверки `auditLog.create` в тестах звонков учитывают метаданные с `campaignId`, полным списком `reasons` и `rules`.

### T-074: Добавить tenant-scoped API аудита

Статус: `done`

Что сделать:

- Добавить endpoint `GET /tenants/:tenantId/audit-logs`.
- Возвращать все события аудита по tenant в порядке убывания `createdAt`.
- Проверять tenant isolation и валидацию tenantId.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`

Критерии готовности:

- Endpoint возвращает только события запрошенного tenant.
- На невалидный tenantId возвращается `VALIDATION_ERROR`.
- На несуществующий tenantId возвращается `TENANT_NOT_FOUND`.
- Запрос к `auditLog.findMany` использует `where: { tenantId }` и `orderBy: { createdAt: 'desc' }`.

### T-075: Добавить фильтрацию и пагинацию для tenant audit-logs

Статус: `done`

Что сделать:

- Добавить query-параметры для `GET /tenants/:tenantId/audit-logs`: `action`, `entityType`, `campaignId`, `limit`, `offset`.
- Реализовать фильтрацию по `action`, `entityType`, `metadata.campaignId` и пагинацию `limit`/`offset`.
- Добавить тесты для новых параметров.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`

Критерии готовности:

- Endpoint корректно применяет фильтры и пагинацию.
- Запрос с невалидными `limit`/`offset` возвращает `VALIDATION_ERROR`.
- `auditLog.findMany` по-прежнему вызывается tenant-scoped c `orderBy: { createdAt: 'desc' }`.

### T-076: Описать API tenant audit-logs

Статус: `done`

Что сделать:

- Добавить route-level документацию для `GET /tenants/:tenantId/audit-logs`.
- Зафиксировать параметры `action`, `entityType`, `campaignId`, `limit`, `offset`, коды ошибок и структуру ответа.

Где менять:

- `docs/audit-logs-api.md`
- `README.md`

Критерии готовности:

- Документ описывает все query-параметры и ошибки для `GET /tenants/:tenantId/audit-logs`.
- `README.md` содержит ссылку на новую документацию.

### T-077: Описать API campaign audit-logs

Статус: `done`

Что сделать:

- Добавить route-level документацию для `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.
- Зафиксировать `campaignId`, `action`, `entityType`, `limit`, `offset`, `errors`, коды ошибок и структуру ответа.
- Указать связь с tenant-scope и поведением валидации параметров.

Где менять:

- `docs/audit-logs-api.md`
- `README.md`

Критерии готовности:

- В документе есть отдельный раздел для campaign-scoped audit endpoint.
- Валидация и ошибки описаны в том же формате, что и tenant-scope.

### T-078: Добавить фильтрацию и пагинацию для campaign audit-logs

Статус: `done`

Что сделать:

- Добавить парсинг query-параметров `action`, `entityType`, `limit`, `offset` для `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.
- Реализовать фильтрацию по `action` и `entityType` с учетом campaign-scoped списка.
- Реализовать пагинацию `limit`/`offset` для campaign-scoped audit логов.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`

Критерии готовности:

- API корректно применяет фильтры `action` и `entityType`.
- API корректно применяет `limit`/`offset` с валидацией.

### T-079: Добавить регрессионный тест дефолтной пагинации campaign audit-logs

Статус: `done`

Что сделать:

- Добавить тест для `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`, который проверяет поведение `limit` и `offset` по умолчанию.
- Зафиксировать, что без явно заданных query параметров возвращается только первые `20` записей, отсортированных по `createdAt` из `auditLog.findMany`.

Где менять:

- `tests/campaign-audit-log.api.test.ts`

Критерии готовности:

- При отсутствии `limit` и `offset` endpoint возвращает максимум `20` записей.
- На отклике соблюдается сортировка `createdAt` descending после применения in-memory фильтрации.

### T-080: Ограничить max limit для audit-logs

Статус: `done`

Что сделать:

- Добавить верхнюю границу `limit` для query-параметра `limit` на `campaign` и `tenant` `audit-logs` endpoints.
- Зафиксировать в тестах, что запросы с `limit > 100` возвращают `VALIDATION_ERROR`.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`

Критерии готовности:

- `limit` ограничен сверху и валидируется через schema.
- Для `limit > 100` на `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` и `GET /tenants/:tenantId/audit-logs` возвращается 400 с `VALIDATION_ERROR`.

### T-081: Обновить документацию audit-logs для max limit

Статус: `done`

Что сделать:

- Обновить `docs/audit-logs-api.md` и добавить для `limit` tenant/campaign `audit-logs` контракт `max = 100`.
- Зафиксировать в документации поведение `limit > 100` как `400 VALIDATION_ERROR` для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.

Где менять:

- `docs/audit-logs-api.md`
- `README.md` (если требуется синхронизация с описанием параметров)

Критерии готовности:

- Дата `max` для `limit` отражена для обоих audit endpoints.
- Поведение валидации при превышении лимита описано в документе/ошибках.

### T-082: Синхронизировать README с ограничениями audit-logs API

Статус: `done`

Что сделать:

- Проверить, достаточно ли в `README.md` текущей ссылки на `docs/audit-logs-api.md` для передачи новых ограничений `limit`.
- Добавить в `README.md` короткую заметку о лимитах пагинации (`limit=1..100`) для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.

Где менять:

- `README.md`

Критерии готовности:

- В README зафиксировано, что `limit` для `audit-logs` endpoints ограничен `max 100`.
- Нет разрыва между README и `docs/audit-logs-api.md` по этому параметру.

### T-083: Ограничить offset для audit-logs pagination

Статус: `done`

Что сделать:

- Добавить верхнюю границу `offset` для query-параметров `limit`/`offset` на `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.
- Зафиксировать через тесты и документацию, что `offset > 1000` возвращает `VALIDATION_ERROR` (сохранив `offset >= 0`).

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`
- `docs/audit-logs-api.md`
- `README.md`

Критерии готовности:

- `offset` валидируется как число в диапазоне `0..1000` для обоих audit endpoints.
- Для `offset > 1000` на обоих endpoints возвращается `400` с `VALIDATION_ERROR`.
- Документация и README отражают новое ограничение.

### T-084: Добавить пагинацию и лимиты для списка звонков

Статус: `done`

Что сделать:

- Добавить валидацию query-параметров `limit` и `offset` для `GET /tenants/:tenantId/campaigns/:campaignId/calls` с дефолтами `limit=20`, `offset=0`, границами `limit: 1..100`, `offset: 0..1000`.
- Вызвать `callAttempt.findMany` с `skip` и `take` на основе `offset` и `limit`.
- Добавить регрессионные тесты: дефолтная пагинация, `limit > 100`, `offset > 1000`, и проверка `skip/take` в вызове репозитория.
- Обновить `docs/calls-api.md` и `README.md` с контрактом пагинации.

Где менять:

- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/calls-api.md`
- `README.md`

Критерии готовности:

- `GET /tenants/:tenantId/campaigns/:campaignId/calls` валидирует `limit/offset`, возвращает 400 при нарушениях, и применяет pagination.
- `callAttempt.findMany` вызывается с `skip`/`take`.
- Договоренности по пагинации отражены в документации и README.

### T-085: Добавить пагинацию и лимиты для usage-events списка

Статус: `done`

Что сделать:

- Добавить query-параметры `limit` и `offset` для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` с дефолтами `limit=20`, `offset=0`, границами `limit: 1..100`, `offset: 0..1000`.
- Передать `skip`/`take` в `usageEvent.findMany` для листового запроса.
- Добавить регрессионные тесты на дефолтную пагинацию и ошибки валидации (`limit > 100`, `offset > 1000`).
- Обновить `README.md` c параметрами пагинации для endpoint usage-events.

Где менять:

- `src/routes/usage.ts`
- `tests/usage.api.test.ts`
- `README.md`

Критерии готовности:

- `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` применяет пагинацию через `skip` и `take`.
- Превышение лимитов `limit/offset` возвращает `400` с `VALIDATION_ERROR`.
- Договоренности по пагинации отражены в документации.

### T-086: Документировать usage-events API

Статус: `done`

Что сделать:

- Добавить route-level контракт для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` и
  `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` в отдельный документ.
- Отразить ограничения пагинации (`limit/offset`) для списка usage events и поведение ошибок валидации.
- Обновить `README.md`, добавив ссылку на новый контракт usage API.

Где менять:

- `docs/usage-api.md`
- `README.md`

Критерии готовности:

- Документ содержит оба endpoint'а usage-events и usage-events/totals с обязательными параметрами и ответами.
- Параметры `limit/offset` и ошибки `VALIDATION_ERROR` зафиксированы для списка событий.
- `README.md` содержит ссылку на usage API.

### T-087: Документировать campaign report API

Статус: `done`

Что сделать:

- Добавить route-level контракт для `GET /tenants/:tenantId/campaigns/:campaignId/report`.
- Зафиксировать схему ответа, коды ошибок и требования tenant isolation.
- Обновить `README.md`, добавив ссылку на новый contract и endpoint в списке API для быстрого навигационного обзора.

Где менять:

- `docs/reports-api.md`
- `README.md`

Критерии готовности:

- Документ существует и описывает endpoint отчета кампании.
- В `README.md` есть ссылка на `docs/reports-api.md` и endpoint `GET /tenants/:tenantId/campaigns/:campaignId/report` в API обзорном блоке.

### T-088: Добавить фильтрацию списка звонков по outcome и qaStatus

Статус: `done`

Что сделать:

- Расширить `GET /tenants/:tenantId/campaigns/:campaignId/calls` новыми query-параметрами `outcome` и `qaStatus` с валидацией.
- Добавить фильтрацию `callAttempt.findMany` по `callResult.outcome` и `callResult.qaStatus`.
- Добавить тесты на позитивный фильтр и негативную валидацию новых параметров.
- Обновить `docs/calls-api.md` с новыми параметрами запроса и ошибкой `VALIDATION_ERROR`.

Где менять:

- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/calls-api.md`

Критерии готовности:

- Набор параметров `outcome`/`qaStatus` корректно валидируется в API.
- На уровне запроса добавляется фильтр по `callResult` только при наличии параметров.
- Для `outcome` и `qaStatus` добавлены регрессионные тесты: валидные значения и ошибки валидации.
- Документация отражает новые query-параметры.

### T-089: Синхронизировать README с фильтрами calls API

Статус: `done`

Что сделать:

- В `README.md` добавить упоминание новых query-параметров для `GET /tenants/:tenantId/campaigns/:campaignId/calls` (`outcome`, `qaStatus`) в заметке по API параметрам.
- Проверить, что README ссылается на актуальный контракт `docs/calls-api.md` и не расходится с ним по параметрам `calls` endpoint.
- Зафиксировать факт синхронизации в журнале изменений плана.

Где менять:

- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- README содержит в заметке по calls API перечисление всех query-параметров, включая `outcome` и `qaStatus`.
- Заметка в README согласована с `docs/calls-api.md` по контракту `GET /tenants/:tenantId/campaigns/:campaignId/calls`.

### T-090: Синхронизировать README с totals endpoint usage-events API

Статус: `done`

Что сделать:

- Обновить список endpoint'ов в `README.md`, добавив `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals`.
- Проверить, что API-обзорный список в README отражает оба endpoints из `docs/usage-api.md`: `usage-events` и `usage-events/totals`.
- Зафиксировать изменение в `Журнале изменений плана`.

Где менять:

- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Endpoint `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` присутствует в README API-обзоре.
- README и `docs/usage-api.md` не расходятся по списку endpoint-имен usage API.

### T-091: Добавить в README параметры и ответ `usage-events/totals`

Статус: `done`

Что сделать:

- Добавить в блок параметров API в README описание, что `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` не принимает пагинацию и возвращает агрегаты по `eventType/unit`.
- Убедиться, что текст в README по usage-events/totals согласован с `docs/usage-api.md`.

Где менять:

- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- README явно отражает контракт totals endpoint: endpoint, смысл и формат агрегированного ответа.
- README и `docs/usage-api.md` согласованы по `usage-events` + `usage-events/totals`.

### T-092: Документировать endpoint ручной проверки compliance

Статус: `done`

Что сделать:

- Добавить новый документ `docs/compliance-api.md` с контрактом `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check`.
- Зафиксировать параметры пути, успешный ответ и ошибки (`VALIDATION_ERROR`, `TENANT_NOT_FOUND`, `DEBTOR_RECORD_NOT_FOUND`, `INVALID_DEBT_AMOUNT`).
- Добавить ссылку на `docs/compliance-api.md` в раздел API документации `README.md` и добавить endpoint в обзорный список контрактов.

Где менять:

- `docs/compliance-api.md`
- `README.md`

Критерии готовности:

- В документе есть route-level контракт для проверки compliance и схема ответа.
- `README.md` содержит ссылку на новый документ и endpoint в обзоре API.

### T-093: Добавить API endpoint списка compliance решений кампании

Статус: `done`

Что сделать:

- Реализовать `GET /tenants/:tenantId/campaigns/:campaignId/compliance-decisions` в `src/routes/compliance.ts` с tenant/campaign isolation.
- Поддержать опциональную фильтрацию по `decision` (`allow`/`block`) и пагинацию (`limit` 1..100, `offset` 0..1000).
- Обновить `docs/compliance-api.md` и README для нового route-level контракта.

Где менять:

- `src/routes/compliance.ts`
- `tests/compliance`
- `docs/compliance-api.md`
- `README.md`

Критерии готовности:

- Endpoint возвращает tenant-scoped список compliance решений по кампании, поддерживает `decision`/pagination.
- Добавлен тест на пагинацию/валидацию и на `404` для отсутствующего tenant/campaign.
- Документация и README включают новый endpoint.

### T-094: Добавить endpoint сводного readiness-summary для кампании

Статус: `done`

Что сделать:

- Добавить `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` для единого источника статуса готовности запуска.
- Считать readiness-показатели на основе реальных сущностей:
  - `DebtorRecord` (наличие импорта),
  - `ScriptVersion` (наличие активной версии),
  - `TelephonyConnection` (наличие активной production-связи),
  - `ComplianceDecision` (наличие blocking решений),
  - tenant/campaign isolation.
- Возвратить `readinessState`, `blocked`, `stale`, `source`, `timestamp`, `readinessHash`, `reasons`, а также `complianceReasons`.
- Добавить API-тесты в `tests/campaigns.create.test.ts`.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`

Критерии готовности:

- Endpoint возвращает `400`/`404` для некорректного tenant/campaign.
- В успешном состоянии `readinessState` отражает readiness из реальных зависимостей (`ready`/`blocked`/`stale`).
- Есть явные причинные блоки в `reasons` и блокирующие причины в `complianceReasons`.
- Тесты покрывают `ready` и `blocked` сценарии.

### T-095: Документировать endpoint campaign readiness summary

Статус: `done`

Что сделать:

- Добавить route-level контракт `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`.
- Зафиксировать `readinessState`, `blocked`, `stale`, `reasons`, `complianceReasons` и ошибки контракта.
- Обновить `README.md`, добавив ссылку на новый документ и endpoint в обзорный список контрактов.

Где менять:

- `docs/campaign-readiness-api.md`
- `README.md`

Критерии готовности:

- Документ содержит полный пример/схему ответа для `readiness-summary`.
- `README.md` включает ссылку на `docs/campaign-readiness-api.md`.
- `README.md` включает endpoint `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` в списке MVP endpoints.

### T-096: Подключить readiness-summary к `prototype` launch flow

Статус: `done`

Что сделать:

- В `prototype.html` добавить запрос к `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` на шагах `readiness` и `launch`.
- Отображать `readinessState`, `blocked`, `stale`, список `reasons` и `complianceReasons` из реального ответа API.
- Блокировать запуск кампании при `readinessState = blocked` до устранения причин.

Где менять:

- `prototype.html`
- `docs/operations/auto-pause.md` (если потребуется синхронизация документации flow)

Критерии готовности:

- После подключения API в UI в launch-панели виден актуальный `readinessState`.
- Кнопка запуск блокируется при `blocked`.
- Ошибки API отображаются как понятный fallback (без падения страницы).

### T-097: Зафиксировать регрессию readiness-summary для `stale` состояния

Статус: `done`

Что сделать:

- Добавить/поддержать регрессионный тест для `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`, который возвращает `readinessState: 'stale'` при свежести данных меньше `campaign.updatedAt`.
- Проверить, что при `stale` отсутствуют blocking причины и `blocked: false`.
- Зафиксировать, что сценарий покрыт в `tests/campaigns.create.test.ts`.

Где менять:

- `tests/campaigns.create.test.ts`

Критерии готовности:

- Тест на `stale` состояния в `readiness-summary` проходит и стабильно воспроизводится в CI.
- `readinessState` для этого сценария равен `stale`.
- `blocked` равен `false`, `reasons` и `complianceReasons` пусты.

### T-098: Покрыть stale readiness в launch-панели прототипа

Статус: `done`

Что сделать:

- В `prototype.html` обновить отображение `readiness-summary` на шаге launch/wizard при `readinessState='stale'`.
- Добавить явный next-action для `stale`: повторная проверка/обновление зависимостей перед запуском.
- Убедиться, что кнопка `launch` и `controlled launch` остаются заблокированными при `stale`.

Где менять:

- `prototype.html`

Критерии готовности:

- На карточке launch для `stale` отображается понятный блок с action path (что нужно сделать).
- `readinessState='stale'` приводит к состоянию, блокирующему запуск в UI.
- Поведение соответствует API-мэппингу `readiness-summary` без изменения контрактов backend.

### T-099: Синхронизировать обзорную readiness-панель с `stale` состоянием

Статус: `done`

Что сделать:

- Добавить отображение `readiness-summary` на вкладке `overview` для секции readiness кампании.
- Для `readinessState='stale'` показать предупреждение о необходимости пересчёта зависимостей перед запуском.
- Убедиться, что в overview и launch одинаково интерпретируется блокировка запуска при `stale`.

Где менять:

- `prototype.html`

Критерии готовности:

- На вкладке `overview` появляется summary readiness из API с состоянием и пояснением.
- Для `stale` блок readiness на overview явно указывает action `перепроверить`/`обновить проверки`.
- Логика остается в `buildReadinessSummaryFromApi`, без изменений backend API.

### T-100: Синхронизировать overview метрики с snapshot отчета кампании

Статус: `done`

Что сделать:

- В `prototype.html` подключить плитки overview к данным отчёта (`report snapshot`) вместо статических чисел.
- Обновлять overview значения при переключении на вкладку `overview` и после успешного/локального рендера отчёта.
- Для отсутствующих расчетных метрик использовать `н/д`, но не использовать фиксированные моковые цифры.

Где менять:

- `prototype.html`

Критерии готовности:

- На overview после открытия вкладки отображаются `Обработано`, `Успешные диалоги`, `Обещания`, `Стоимость диалога` из snapshot (live/local), а не статические числовые значения.
- При открытии overview вызывается синхронизация KPI из `campaign report snapshot`.
- В случае отсутствия рассчитанной стоимости в модели отображается `н/д`, а не жесткая placeholder-цена.

### T-101: Добавить стоимость в campaign report из usage-событий

Статус: `done`

Что сделать:

- Добавить в `CampaignReport` поля стоимости: `connectedMinutes`, `costPerCall`, `costPerPtp`.
- Посчитать `connectedMinutes` через агрегированные usage-events по `eventType='call_completed'` и `unit='minute'` с дедупликацией источников.
- Расчитать `costPerCall` и `costPerPtp` из real events (без моковых значений) и передать в `prototype` через API snapshot.

Где менять:

- `src/reports/campaign-report.ts`
- `src/routes/reports.ts`
- `src/server/app.ts`
- `tests/reports/campaign-report.test.ts`
- `tests/reports/campaign-report.api.test.ts`
- `prototype.html`

Критерии готовности:

- `GET /tenants/:tenantId/campaigns/:campaignId/report` возвращает новые поля:
  - `connectedMinutes`
  - `costPerCall`
  - `costPerPtp`
- `campaign report` в прототипе показывает `report minutes` и использует новые поля в стоимости.
- Для кампаний без `usage-events` метрики стоимости корректно показывают отсутствие данных (`н/д` в UI).
- Добавлены и обновлены unit-тесты для backend сервиса и API отчета.

### T-102: Привязать cost-показатели отчета к тарифу по минутам

Статус: `done`

Что сделать:

- Добавить источник тарифов v0 (RUB/мин) для расчета стоимостных метрик отчета.
- Перевести `costPerCall` и `costPerPtp` в денежный вид с использованием тарифа и уже рассчитанных usage-метрик.
- Добавить тесты на тарифный расчет, чтобы проверка была устойчивой к изменению коэффициента.

Где менять:

- `src/domain/billing/index.ts`
- `src/reports/campaign-report.ts`
- `tests/reports/campaign-report.test.ts`
- `tests/reports/campaign-report.api.test.ts`

Критерии готовности:

- Отчет возвращает `costPerCall` и `costPerPtp` в ₽ по тарифу `connectedMinuteRate`.
- Значения `costPer*` корректно становятся `null`, если usage-метрики отсутствуют.
- Добавлены/обновлены unit-тесты с проверкой тарифной формулы.

### T-103: Вынести тарифные коэффициенты в конфиг для конфигурируемой тарификации

Статус: `done`

Что сделать:

- Сделать `connectedMinuteRate` настраиваемым через конфиг приложения/tenant settings без пересборки.
- Добавить валидацию для положительности тарифного коэффициента.
- Применить новый источник тарифа в `createCampaignReport`.

Где менять:

- `src/domain/billing/index.ts`
- `src/reports/campaign-report.ts`
- `src/routes/reports.ts`
- `src/config/env.ts`
- `.env.example`
- `tests/reports/campaign-report.test.ts`
- `tests/reports/campaign-report.api.test.ts`
- `tests/domain-billing.test.ts`

Критерии готовности:

- Тариф можно изменить через конфиг без изменения кода.
- Нулевой/отрицательный тариф приводит к ошибке валидации/запрещенному значению.
- При изменении тарифа соответствующие unit-тесты отражают новую стоимость.

### T-104: Добавить tenant-level override тарифа connectedMinuteRateRub

Статус: `done`

Что сделать:

- Добавить optional-поле `connectedMinuteRateRub` в `Tenant` и миграцию БД.
- В `GET /tenants/:tenantId/campaigns/:campaignId/report` применять тариф tenant, если он задан, иначе fallback на `env.BILLING_CONNECTED_MINUTE_RATE_RUB`.
- Добавить проверку такого поведения в API-тестах отчета.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/0012_add_connected_minute_rate_to_tenant/migration.sql`
- `src/routes/reports.ts`
- `tests/reports/campaign-report.api.test.ts`

Критерии готовности:

- `tenant.connectedMinuteRateRub` применяется в расчете `costPerCall` и `costPerPtp` для отчета.
- При отсутствии tenant override используются глобальные env-значения тарифа.
- Есть API-тест для tenant override и fallback в env.

### T-105: Добавить tenant billing settings API

Статус: `done`

Что сделать:

- Добавить endpoint `GET /tenants/:tenantId/billing/settings` для чтения tenant-значений тарифа и расчета resolved-значения.
- Добавить endpoint `PATCH /tenants/:tenantId/billing/settings` для изменения `connectedMinuteRateRub` только владельцами/интеграционными администраторами.
- При PATCH добавить audit log события обновления тарифных параметров tenant.

Где менять:

- `src/routes/tenants.ts`
- `src/server/app.ts`
- `tests/tenants.billing-settings.api.test.ts`

Критерии готовности:

- GET endpoint возвращает `connectedMinuteRateRub` и `resolvedConnectedMinuteRateRub` (override или env fallback).
- PATCH endpoint валидирует payload (`null` или положительное число), сохраняет поле в tenant и блокирует неразрешенные роли.
- Проверен аудит события обновления с корректными `tenantId`, `userId`, `entityId` и метаданными.

### T-106: Добавить API-документацию tenant billing settings

Статус: `done`

Что сделать:

- Добавить route-level документ с контрактами `GET /tenants/:tenantId/billing/settings` и `PATCH /tenants/:tenantId/billing/settings`.
- Обновить `README.md` ссылкой на документ и добавить эти endpoints в перечень MVP contracts.

Где менять:

- `docs/tenant-billing-api.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Оба endpoint присутствуют в `docs/tenant-billing-api.md` с параметрами, запросами, ответами и типами ошибок.
- `README.md` ссылается на документ и перечисляет оба endpoint.

### T-107: Унифицировать proof bundle в карточке звонка

Статус: `done`

Что сделать:

- Добавить единый блок evidence bundle в ответ `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId` для звонка.
- Обновить контракт и тесты, чтобы UI и API-автоматизация читали единое поле для audit-first proof.

Где менять:

- `src/routes/calls.ts`
- `docs/calls-api.md`
- `tests/calls/sandbox-call.api.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Ответ endpoint карточки звонка содержит поле `evidenceBundle` с `callResult`, `complianceDecisions`, `usageEvents`.
- Tenant/campaign isolation и ошибки изоляции не меняются.
- Обновлен контракт и тесты на новый bundle.

### T-108: Аудитирование перехода статуса кампании

Статус: `done`

Что сделать:

- Добавить запись аудита для `PATCH /tenants/:tenantId/campaigns/:campaignId/status`.
- Сохранять `from`/`to` статуса, `campaignId`, `actorId` и `tenantId` в `metadata`.
- Обновить тесты статусного перехода на проверку audit trail.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- На успешном переходе статуса создается `auditLog.create` с `action: 'campaign.status_updated'`.
- В `metadata` есть `fromStatus`, `toStatus`, `campaignId`.
- Тесты покрытия нового поведения проходят.

### T-109: Добавить review queue для flagged звонков кампании

Статус: `done`

Что сделать:

- Добавить `GET /tenants/:tenantId/campaigns/:campaignId/review-items`.
- Возвращать записи для `callResult.qaStatus='flagged'` и/или `Campaign`/`CallResult` compliance-блокирующих сигналов.
- Учитывать tenant/campaign isolation и возвращать `createdAt`/`retryCount`/`urgency`/`itemType`.

Где менять:

- `src/routes/campaigns.ts` или новый `src/routes/review.ts`
- `tests/campaigns.create.test.ts` (или отдельный `tests/review.api.test.ts`)
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Endpoint возвращает `review items` только для запрошенного `tenantId`/`campaignId`.
- Содержит отдельные элементы для `qa` и `compliance` и сортировку по `createdAt` (desc).
- Присутствует минимум один тест с корректной изоляцией и фильтрацией.

### T-110: Добавить API для закрытия review item

Статус: `done`

Что сделать:

- Добавить `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve`.
- Поддержать tenant/campaign isolation + разбор `itemType` по префиксу `qa-`/`compliance-`.
- Для QA-элемента обновить `qaStatus` в `CallResult` (`approve` -> `approved`, остальные действия -> `flagged`) и писать `auditLog`.
- Для compliance-элемента записывать аудит по решению и возвращать подтверждение обработки.
- Добавить минимальные регрессионные тесты в `tests/campaigns.create.test.ts`.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Endpoint возвращает `200` с `itemType`, `itemId`, `action` и `tenantId`/`campaignId`.
- Неверный `itemId` возвращает `INVALID_REVIEW_ITEM_ID`.
- Проверка tenant/campaign isolation: `TENANT_NOT_FOUND`, `CAMPAIGN_NOT_FOUND` по текущему механизму.
- Положительный кейс создает `auditLog.create` с `action: 'review_item.resolved'`.

### T-111: Защитить resolve compliance-item от не-bлокирующих решений

Статус: `done`

Что сделать:

- Обновить `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve` для compliance-потока, чтобы `compliance-...` item обрабатывался только при `decision: 'block'`.
- Если найденный `complianceDecision` существует, но уже не в `block`-состоянии, вернуть `REVIEW_ITEM_NOT_FOUND` как несоответствие review scope.
- Добавить регрессионный тест на этот сценарий в `tests/campaigns.create.test.ts` без side-effectов в `auditLog`.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Endpoint корректно фильтрует `complianceDecision` через `decision: 'block'` в запросе.
- Для `compliance-*` item со статусом не-block вернется `404` + `REVIEW_ITEM_NOT_FOUND`.
- Тест гарантирует отсутствие `auditLog.create` в этом кейсе.

### T-112: Добавить RBAC для review-items API

Статус: `done`

Что сделать:

- Добавить middleware авторизации для `GET /tenants/:tenantId/campaigns/:campaignId/review-items` и `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve`.
- Разрешить доступ только ролям, участвующим в управлении кампанией и QC (`owner`, `collection_manager`, `qa_analyst`, `compliance_officer`).
- Добавить тесты 401/403 для отсутствующего и запрещенного `X-User-Role`.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `docs/review-items-api.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Обе review-items операции проверяют роль через `X-User-Role`.
- Для операций review-items при отсутствии роли возвращают `USER_ROLE_MISSING`, для неподходящей роли — `FORBIDDEN`.
- Тесты покрывают как успешный проход с разрешенной ролью, так и отказы на роли.

### T-113: Добавить RBAC для calls API

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`.
- Добавить `roleMiddleware` для `GET /tenants/:tenantId/campaigns/:campaignId/calls` и `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`.
- Зафиксировать в документации, какие роли разрешены для каждого из этих endpoints через `X-User-Role`.

Где менять:

- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/calls-api.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Добавлена проверка ролей `X-User-Role` на новые endpoints согласно задаче.
- Для `sandbox` допускаются `owner`, `collection_manager`, `operator`; для чтения звонков — `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Добавлены тесты для 401 (`USER_ROLE_MISSING`) и 403 (`FORBIDDEN`) по каждому защищённому `calls`-endpoint.
- Контракты в `docs/calls-api.md` обновлены.

### T-114: Добавить RBAC для usage-events API

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` и `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals`.
- Разрешить роли: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Добавить проверки на `USER_ROLE_MISSING` и `FORBIDDEN` для каждого из двух защищённых usage-endpoint-ов.
- Обновить `docs/usage-api.md` с RBAC и новыми кодами ошибок.

Где менять:

- `src/routes/usage.ts`
- `tests/usage.api.test.ts`
- `docs/usage-api.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Оба usage endpoint-а защищены `X-User-Role`.
- `owner` проходит успешно, а неподходящая роль (`auditor`) получает `FORBIDDEN`.
- Для endpoints отсутствующий `X-User-Role` возвращает `USER_ROLE_MISSING`.
- Документация и журнал плана обновлены.

### T-115: Добавить RBAC для report API

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `GET /tenants/:tenantId/campaigns/:campaignId/report`.
- Разрешить роли: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Добавить проверки `USER_ROLE_MISSING` и `FORBIDDEN`.
- Обновить `docs/reports-api.md` с RBAC и новыми кодами ошибок.

Где менять:

- `src/routes/reports.ts`
- `tests/reports/campaign-report.api.test.ts`
- `docs/reports-api.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Отчетный endpoint защищен через `X-User-Role` с перечисленными ролями.
- `owner` получает успешный ответ, `auditor` получает `FORBIDDEN`.
- Для отсутствующего заголовка возвращается `USER_ROLE_MISSING`.
- Документация и журнал плана обновлены.

### T-116: Добавить RBAC для readiness-summary API

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`.
- Разрешить роли: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Добавить проверки `USER_ROLE_MISSING` и `FORBIDDEN`.
- Обновить `docs/campaign-readiness-api.md` с RBAC и новыми кодами ошибок.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `docs/campaign-readiness-api.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Endpoint `readiness-summary` закрыт `X-User-Role` с перечисленными ролями.
- `owner` получает успешный ответ, `auditor` получает `FORBIDDEN`.
- Для отсутствующего заголовка возвращается `USER_ROLE_MISSING`.
- Документация и журнал плана обновлены.

### T-117: Синхронизировать Calls API документацию с RBAC-контрактом

Статус: `done`

Что сделать:

- Добавить в `docs/calls-api.md` ошибки `USER_ROLE_MISSING` и `FORBIDDEN` для защищённых call endpoints.
- Зафиксировать требования ролей для `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox` и `GET /.../calls` endpoints явно в секциях ошибок.
- Добавить краткую заметку в `README.md` про требования `X-User-Role` для call endpoints с перечислением ролей.

Где менять:

- `docs/calls-api.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- `POST /calls/sandbox` и `GET /calls` описаны с `USER_ROLE_MISSING` / `FORBIDDEN` в `docs/calls-api.md`.
- В `docs/calls-api.md` указаны конкретные роли доступа для sandbox и чтения звонков.
- README содержит заметку о ролях `calls` endpoints и `X-User-Role`.

### T-118: Синхронизировать RBAC decision doc с текущими endpoint ролями

Статус: `done`

Что сделать:

- Добавить в `docs/security/rbac.md` endpoint-level требования ролей для защищённых API (`calls`, `usage`, `report`, `readiness-summary`).
- Зафиксировать поведение ошибок `USER_ROLE_MISSING` и `FORBIDDEN` в разделе примечаний и связать с текущими middleware-паттернами.

Где менять:

- `docs/security/rbac.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Документ отражает фактические роли доступа для `POST /.../calls/sandbox`, `GET /.../calls`, `GET /.../usage-events`, `GET /.../usage-events/totals`, `GET /.../report`, `GET /.../readiness-summary`.
- В документ добавлены требования `X-User-Role` и ошибки доступа `USER_ROLE_MISSING`/`FORBIDDEN`.

### T-119: Защитить compliance API RBAC и обновить документацию

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check`.
- Добавить `roleMiddleware` для `GET /tenants/:tenantId/campaigns/:campaignId/compliance-decisions`.
- Задать единый список разрешенных ролей: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Обновить `docs/compliance-api.md` и `README.md` с RBAC-разделом для обоих endpoints и `USER_ROLE_MISSING`/`FORBIDDEN`.
- Добавить/обновить тесты для 401/403 и успешного доступа через роли.

Где менять:

- `src/routes/compliance.ts`
- `tests/compliance/api-check.test.ts`
- `tests/compliance/decisions-list.api.test.ts`
- `docs/compliance-api.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- `POST /tenants/:tenantId/.../compliance/check` и `GET /tenants/:tenantId/.../compliance-decisions` защищены `roleMiddleware`.
- Для всех защищённых случаев возвращаются `USER_ROLE_MISSING` и `FORBIDDEN` с ожидаемыми сообщениями.
- В `docs/compliance-api.md` и `README.md` описаны разрешённые роли и ошибки доступа.
- Обновлен журнал плана.

### T-120: Защитить QA endpoint звонка RBAC и синхронизировать документацию

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` к `PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa`.
- Ограничить роли до `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`.
- Добавить проверки `USER_ROLE_MISSING` и `FORBIDDEN` для QA-эндпоинта, и валидный сценарий с ролью `qa_analyst`.
- Синхронизировать endpoint в `docs/calls-api.md`.
- Добавить/обновить `PATCH /.../calls/:callAttemptId/qa` в `docs/security/rbac.md`.
- Обновить `README.md` заметку по `X-User-Role` для нового endpoint.

Где менять:

- `src/routes/qa.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/calls-api.md`
- `docs/security/rbac.md`
- `README.md`

Критерии готовности:

- `PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa` защищен middleware.
- Для невалидной/отсутствующей роли возвращаются `USER_ROLE_MISSING` и `FORBIDDEN`.
- `qa_analyst` может успешно обновлять `qaStatus`.
- Endpoint и роли задокументированы в `docs/calls-api.md`, `docs/security/rbac.md`, `README.md`.

### T-121: Защитить смену статуса кампании RBAC и синхронизировать документацию

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `PATCH /tenants/:tenantId/campaigns/:campaignId/status`.
- Ограничить роли до `owner`, `collection_manager`.
- Добавить проверки `USER_ROLE_MISSING` и `FORBIDDEN`, обновить успешные сценарии с `X-User-Role`.
- Синхронизировать endpoint в `docs/security/rbac.md`.
- Обновить `README.md` заметку по `X-User-Role` для смены статуса кампании.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `docs/security/rbac.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- `PATCH /tenants/:tenantId/campaigns/:campaignId/status` защищен `roleMiddleware`.
- Для невалидной/отсутствующей роли возвращаются `USER_ROLE_MISSING` и `FORBIDDEN`.
- `owner` может успешно переводить статус кампании.
- Endpoint и роли задокументированы в `docs/security/rbac.md` и `README.md`.

### T-122: Защитить чтение кампаний RBAC

Статус: `done`

Что сделать:

- Защитить `GET /tenants/:tenantId/campaigns` через `roleMiddleware` с ролями:
  `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Защитить `GET /tenants/:tenantId/campaigns/:campaignId` теми же ролями.
- Добавить проверки `USER_ROLE_MISSING`/`FORBIDDEN` и обновить успешные сценарии с `X-User-Role`.
- Синхронизировать `docs/security/rbac.md` и `README.md`.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `docs/security/rbac.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- `GET /tenants/:tenantId/campaigns` и `GET /tenants/:tenantId/campaigns/:campaignId` защищены `roleMiddleware`.
- Для невалидной/отсутствующей роли на обоих endpoints возвращаются `USER_ROLE_MISSING` и `FORBIDDEN`.
- `owner` может успешно читать список и карточку кампании.
- Endpoint и роли задокументированы в `docs/security/rbac.md` и `README.md`.

### T-123: Добавить Campaign API документацию (read endpoints)

Статус: `done`

Что сделать:

- Добавить `docs/campaigns-api.md` с route-level контрактом для `GET /tenants/:tenantId/campaigns` и `GET /tenants/:tenantId/campaigns/:campaignId`.
- Зафиксировать tenant isolation, ошибки (`VALIDATION_ERROR`, `TENANT_NOT_FOUND`, `CAMPAIGN_NOT_FOUND`), поля ответа и пагинацию (для списка).
- Добавить ссылки на документацию в README.

Где менять:

- `docs/campaigns-api.md` (новый файл)
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Документ содержит оба read-endpoint с примерами запроса/ответа и кода ошибок.
- README содержит ссылку на `docs/campaigns-api.md` и endpoint-list для campaign read endpoints.

### T-124: Защитить audit-logs endpoints RBAC

Статус: `done`

Что сделать:

- Добавить `roleMiddleware` для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.
- Определить роли доступа для чтения audit-logs в соответствии с `docs/security/rbac.md`.
- Добавить/обновить проверки `USER_ROLE_MISSING` и `FORBIDDEN` и позитивные случаи с валидной ролью в тестах.
- Синхронизировать `docs/security/rbac.md`, `docs/audit-logs-api.md` и `README.md` по правам доступа.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaign-audit-log.api.test.ts`
- `docs/security/rbac.md`
- `docs/audit-logs-api.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Оба `audit-logs` endpoint возвращают `USER_ROLE_MISSING`, если `X-User-Role` отсутствует.
- Эндпоинты возвращают `FORBIDDEN` для роли без прав.
- `owner` и роль из разрешенного списка успешно проходят на обоих `audit-logs` endpoint.
- Документы `docs/security/rbac.md`, `docs/audit-logs-api.md` и `README.md` согласованы по доступу к audit-logs.

### T-125: Добавить глобальный rate limiting для API

Статус: `done`

Что сделать:

- Добавить middleware `rate-limit` в `src/server/middleware/rate-limit.ts` с лимитом запросов и окном времени.
- Подключить middleware глобально в `src/server/app.ts` до регистрации маршрутов.
- Добавить настройки лимитов в `src/config/env.ts` и `.env.example` (с безопасными значениями по умолчанию).
- Добавить regression-тест, который проверяет блокировку запроса после превышения лимита для одного IP в окне.

Где менять:

- `src/server/middleware/rate-limit.ts`
- `src/server/app.ts`
- `src/config/env.ts`
- `.env.example`
- `tests/rate-limit.api.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Превышение лимита в рамках окна отдаёт HTTP `429` c `error: RATE_LIMIT_EXCEEDED`.
- Лимит настраивается через env-параметры и имеет значения по умолчанию.
- Middleware применяется к health и защищённым API endpoints одинаково.
- Regression-тест покрывает сценарий превышения и корректный ответ.

- 16.08.2026: `T-119` переведена в `done`; добавлены RBAC-ограничения для `POST /.../compliance/check` и `GET /.../compliance-decisions` с ролями `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- в `src/routes/compliance.ts` добавлен общий middleware для обоих endpoints;
- в `tests/compliance/api-check.test.ts` и `tests/compliance/decisions-list.api.test.ts` добавлены проверки 401/403 и обновлены существующие сценарии с `x-user-role`;
- `docs/compliance-api.md` дополнена секцией RBAC и ошибками `USER_ROLE_MISSING`/`FORBIDDEN`; `README.md` дополнен короткой заметкой по ролям для compliance endpoints;
- проверки: `npm run test tests/compliance/api-check.test.ts tests/compliance/decisions-list.api.test.ts`.

- 16.08.2026: `T-118` переведена в `done`; синхронизирована `docs/security/rbac.md` с endpoint-level RBAC фактически применённым в коде:
  - добавлены явные требования ролей для `POST /.../calls/sandbox`, `GET /.../calls`, `GET /.../calls/:callAttemptId`;
  - добавлены явные требования ролей для `GET /.../usage-events`, `GET /.../usage-events/totals`, `GET /.../report`, `GET /.../readiness-summary`;
  - в разделе примечаний документа зафиксированы поведенческие ошибки `USER_ROLE_MISSING` и `FORBIDDEN`;
  - проверки: `npm run test tests/calls/sandbox-call.api.test.ts`, `npm run test tests/usage.api.test.ts`, `npm run test tests/reports/campaign-report.api.test.ts`, `npm run test tests/campaigns.create.test.ts`.
### T-126: Логировать срабатывание rate limit в audit log

Статус: `done`

Что сделать:

- Расширить middleware rate limiting payload информацией для аудита (`tenantId`, `requestPath`, `requestId`, метаданные лимита).
- На срабатывание лимита создавать запись `security.rate_limit_exceeded` в `AuditLog` через зависимости приложения.
- Сохранять устойчивость: ошибка аудита не должна влиять на выдачу HTTP `429`.
- Зафиксировать callback contract для опционального переопределения поведения на срабатывание лимита.

Где менять:

- `src/server/middleware/rate-limit.ts`
- `src/server/app.ts`
- `tests/rate-limit.api.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- `onLimitExceeded` вызывается с полями `tenantId`, `requestPath`, `requestId`, `windowMs`, `limit`, `used`, `resetAt`, `ip`, `method`, `statusCode`, `errorCode`.
- На превышении лимита создаётся `AuditLog` с `action: 'security.rate_limit_exceeded'` и метаданными.
- Ошибка записи в audit log не ломает 429 response (callback/аудит обрабатывается с catch).
- Regression-тест подтверждает вызов callback и валидный payload.

### T-127: Вычистить пользовательские тексты и лишние вкладки кабинета

Статус: `done`

Что сделать:

- Убрать из `prototype.html` внутренние формулировки (`test-call`, `compliance`, `Readiness`, `Review`, `controlled launch`) из видимого UI.
- Убрать IA-блоки сайдбара, маркетинговый hero и отладочные элементы (симуляция автопаузы, дубль drawer, переключатель роли в отчёте).
- Сократить навигацию: глобально без «Сценарии»; внутри кампании без вкладки «Телефония», `Review` → `Проверка`.
- Оставить кликабельность кабинета.

Где менять:

- `prototype.html`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- В сайдбаре нет «Готовность к запуску» с `test-call → compliance`.
- Вкладки кампании: Обзор, База, Сценарий, Телефония, Запуск, Звонки, Проверка, Отчёт, Настройки.
- Видимые строки говорят языком оператора взыскания.

### T-128: Починить переключение разделов внутри кампании

Статус: `done`

Что сделать:

- Исправить сломанную вёрстку `campaign-view` в `prototype.html`, из-за которой вкладки после «Запуск» не открывались.
- Вернуть вкладку «Телефония» внутри кампании.
- Закрепить проверкой структуры HTML.

Где менять:

- `prototype.html`
- `tests/prototype-campaign-views.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Каждый `data-camp-view` сбалансирован по `div` и не вложен в соседний раздел.
- Вкладки кампании соответствуют экранам: overview, base, scenario, phone, launch, calls, review, report, settings.
- Тест `tests/prototype-campaign-views.test.ts` проходит.

## P1. Rulebook v1: допуск до звонка

Источник: `docs/compliance/rulebook-v1.md`. Волна pre-dial после Lab hardening: первая `todo` — `T-130`.
Лимиты 1/2/8 и календарь внедряются как **продуктовый system-lock** из rulebook, не как утверждённое юрзаключение. Live по-прежнему закрыт правилами `T-138`/`T-139` до legal memo.

### T-129: Блокировать consentStatus=pending

Статус: `done`

Что сделать:

- В `ConsentStatusRule` блокировать `pending` с кодом `CONSENT_PENDING_BLOCK` наряду с `revoked` → `CONSENT_REVOKED`.
- Пропускать только `given`.
- Обновить тесты, где `pending` сейчас даёт `allow`.

Где менять:

- `src/compliance/rules/consent-status.ts`
- `tests/compliance/consent-status.test.ts`
- `tests/compliance/api-check.test.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/compliance/rulebook-v1.md` (статус внедрения R-CONSENT)

Критерии готовности:

- `pending` и `revoked` дают `block`; `given` даёт `allow`.
- Sandbox-звонок с `pending` не создаёт `CallAttempt`.
- `npm run test -- tests/compliance tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- `ConsentStatusRule` блокирует всё, кроме `given`: `revoked` → `CONSENT_REVOKED`, иное (включая `pending`) → `CONSENT_PENDING_BLOCK`.
- Sandbox с `pending` отвечает 403 и не создаёт `CallAttempt`.
- R-CONSENT в rulebook отмечен как внедрённый для Lab/Pilot.

Изменено:
- `src/compliance/rules/consent-status.ts`
- `tests/compliance/consent-status.test.ts`
- `tests/compliance/api-check.test.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/compliance/rulebook-v1.md`

Контекст для следующих задач:
- Импорт по-прежнему принимает `pending` в CSV — запись создаётся, но звонок не стартует.
- Неизвестный `consentStatus` тоже fail-closed через `CONSENT_PENDING_BLOCK`.

### T-130: Разделить окно звонка на будни и выходные

Статус: `done`

Что сделать:

- Считать местный день должника по `timezone`.
- Будни: 08:00–22:00; суббота и воскресенье: 09:00–20:00.
- Клиентское окно, если появится позже, не может быть шире этого минимума; в этой задаче достаточно системного минимума.

Где менять:

- `src/compliance/rules/call-window.ts`
- `tests/compliance/call-window.test.ts`

Критерии готовности:

- Есть тесты на будний 21:30 = allow и воскресный 08:30 = block при той же таймзоне.
- Reason code по-прежнему `CALL_WINDOW_BLOCK`.
- В reasonText/UI не писать «по ФЗ-230»: это продуктовая рамка rulebook, legal memo ещё нет.
- `npm run test -- tests/compliance/call-window.test.ts` проходит.

Результат:
- Местный weekday по `timezone`: будни 08:00–22:00, Sat/Sun 09:00–20:00.
- Reason `CALL_WINDOW_BLOCK`, текст без «ФЗ-230».

Изменено:
- `src/compliance/rules/call-window.ts`
- `tests/compliance/call-window.test.ts`
- `docs/compliance/rulebook-v1.md`

Контекст для следующих задач:
- Праздники (`T-131`) должны использовать то же weekend-окно, не дублировать часы.
- `parseTimeWindow` сохранён для будущего client-narrowing.

### T-131: Добавить нерабочие праздники в окно звонка

Статус: `done`

Что сделать:

- Зафиксировать продуктовый календарь нерабочих дней РФ на 2026–2027 отдельным модулем.
- В эти дни применять окно выходных 09:00–20:00.
- В комментарии модуля указать, что список — продуктовая рамка, не legal sign-off.

Где менять:

- `src/compliance/rules/russian-holidays.ts`
- `src/compliance/rules/call-window.ts`
- `tests/compliance/call-window.test.ts`

Критерии готовности:

- Известный праздничный день в 10:00 = allow, в 08:30 = block.
- Календарь не зашит внутрь `evaluate` без возможности тестировать дату.
- Модуль явно помечает список как продуктовую рамку, не legal sign-off.
- `npm run test -- tests/compliance/call-window.test.ts` проходит.

Результат:
- Календарь 2026–2027 в `russian-holidays.ts` (продуктовая рамка, не legal sign-off).
- Праздник использует то же окно, что выходные (09:00–20:00).
- Дата проверяется через `localCalendarDate` / `isProductNonWorkingHoliday`, не внутри литералов `evaluate`.

Изменено:
- `src/compliance/rules/russian-holidays.ts`
- `src/compliance/rules/call-window.ts`
- `tests/compliance/call-window.test.ts`
- `tests/compliance/russian-holidays.test.ts`
- `docs/compliance/rulebook-v1.md`

Контекст для следующих задач:
- Переносы выходных в календаре не кодировались; это не official production calendar.
- Frequency (`T-132+`) не зависит от праздников.

### T-132: Создать схему FrequencyLedger

Статус: `done`

Что сделать:

- Добавить таблицу счётчика взаимодействий: `tenantId`, `creditorKey`, `obligationId`, `bucket` (`day`/`week`/`month`), `periodStart`, `count`.
- Уникальность `(tenantId, creditorKey, obligationId, bucket, periodStart)`.
- Пока `creditorKey` = `tenantId`, `obligationId` = `DebtorRecord.externalId`, если отдельного creditor ещё нет.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/frequency-ledger/index.ts`

Критерии готовности:

- Prisma-модель и миграция существуют.
- Доменный тип покрывает поля и buckets.
- Повторная миграция на чистой БД применяется.
- Лимит 1/2/8 в коде — продуктовый cap; live как «норма закона» не включать без legal memo (`T-138`/`T-139`).

Результат:
- Модель `FrequencyLedger` + enum `FrequencyBucket`.
- `PRODUCT_FREQUENCY_CAPS` = 1/2/8 как продуктовый cap.
- Миграция `0016_init_frequency_ledger` с `IF NOT EXISTS`.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0016_init_frequency_ledger/migration.sql`
- `src/domain/frequency-ledger/index.ts`
- `tests/domain-frequency-ledger.test.ts`
- `docs/domain-model.md`

Контекст для следующих задач:
- Lab mapping: `creditorKey` = `tenantId`, `obligationId` = `externalId`.
- Инкремент и идемпотентность `callAttemptId` — `T-133`.
- Не включать caps в UI как «норму закона».

### T-133: Сервис инкремента frequency ledger

Статус: `done`

Что сделать:

- Идемпотентно учитывать попытку один раз по `callAttemptId`.
- Консервативное продуктовое правило из rulebook: инкремент с статуса `ringing` и далее; `queued`/`initiated`/`blocked` не считать.
- Инкрементировать day/week/month buckets.

Где менять:

- `src/domain/frequency-ledger/index.ts`
- `tests/compliance/frequency-ledger.test.ts`

Критерии готовности:

- Повторный вызов с тем же `callAttemptId` не увеличивает `count`.
- `queued` не инкрементирует; `ringing` инкрементирует.
- `npm run test -- tests/compliance/frequency-ledger.test.ts` проходит.

Результат:
- `recordFrequencyAttempt` считает `ringing`+; `queued`/`initiated`/`blocked` ignored.
- Идемпотентность по `callAttemptId`.
- In-memory repository для тестов; periodStart в UTC (day/ISO-week Monday/month).

Изменено:
- `src/domain/frequency-ledger/index.ts`
- `tests/compliance/frequency-ledger.test.ts`

Контекст для следующих задач:
- Sandbox ещё не вызывает инкремент — это `T-135` (не считать sandbox).
- `T-134` читает `getCount` до старта звонка.
- Period boundaries — UTC, не timezone должника.

### T-134: Добавить правило FREQUENCY_LIMIT_BLOCK

Статус: `done`

Что сделать:

- Лимиты system-lock: 1 / сутки, 2 / неделя, 8 / месяц.
- Правило читает ledger и блокирует превышение **до** старта звонка.
- Подключить в `ComplianceEngine` рядом с существующими правилами.

Где менять:

- `src/compliance/rules/frequency-limit.ts`
- `src/compliance/engine/compliance-engine.ts`
- `src/routes/calls.ts`
- `src/routes/compliance.ts`
- `tests/compliance/frequency-limit.test.ts`

Критерии готовности:

- При `day count >= 1` новая проверка даёт `FREQUENCY_LIMIT_BLOCK`.
- Decision log сохраняет код.
- `npm run test -- tests/compliance` проходит.

Результат:
- `FrequencyLimitRule` читает ledger до старта; caps 1/2/8.
- Подключено в sandbox/compliance engine.
- Reason без «ФЗ-230». Default in-memory ledger пустой, поэтому существующие sandbox-тесты не блокируются.

Изменено:
- `src/compliance/rules/frequency-limit.ts`
- `src/compliance/rules/decision.ts`
- `src/routes/calls.ts`
- `src/routes/compliance.ts`
- `tests/compliance/frequency-limit.test.ts`
- `tests/compliance/api-check.test.ts`
- `docs/compliance/rulebook-v1.md`

Контекст для следующих задач:
- Инкремент на sandbox ещё не вызывается — `T-135` должен добавить production-only increment, не sandbox.
- `obligationId` = `externalId` или id записи.

### T-135: Исключить sandbox из frequency ledger

Статус: `done`

Что сделать:

- Инкремент ledger только если `TelephonyConnection.mode=production`.
- Sandbox API не меняет счётчик 1/2/8.

Где менять:

- `src/domain/frequency-ledger/index.ts`
- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `tests/compliance/frequency-ledger.test.ts`

Критерии готовности:

- Успешный sandbox-звонок не создаёт/не увеличивает FrequencyLedger.
- Тест на production-mode increment есть (можно на fake connection без сети).
- `npm run test -- tests/calls/sandbox-call.api.test.ts tests/compliance/frequency-ledger.test.ts` проходит.

Результат:
- `shouldRecordFrequencyAttempt`: только `channel=live` + `mode=production`.
- Sandbox route всегда `channel=sandbox` — ledger не трогает, даже если кампания на production connection.

Изменено:
- `src/domain/frequency-ledger/index.ts`
- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `tests/compliance/frequency-ledger.test.ts`

Контекст для следующих задач:
- Live-маршрут должен вызывать `recordFrequencyAttempt` с `channel: 'live'`.
- Readiness production ≠ sandbox increment.

### T-136: Создать схему списка исключений

Статус: `done`

Что сделать:

- Tenant-scoped `SuppressionEntry`: `phone` и/или `externalId`, причина, `createdAt`.
- Уникальность непустого телефона и непустого `externalId` в рамках tenant.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/suppression-entry/index.ts`

Критерии готовности:

- Модель и миграция существуют.
- Доменный тип описывает поля.
- Нет секретов и сырого vendor payload.

Результат:
- `SuppressionEntry` с partial unique indexes на непустые `phone`/`externalId`.
- Доменный guard: нужна хотя бы одна идентичность.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0017_init_suppression_entry/migration.sql`
- `src/domain/suppression-entry/index.ts`
- `tests/domain-suppression-entry.test.ts`

Контекст для следующих задач:
- Правило `T-137` читает tenant-scoped lookup по phone или externalId.
- API управления списком в этой задаче нет.

### T-137: Добавить правило SUPPRESSION_BLOCK

Статус: `done`

Что сделать:

- Блокировать допуск, если телефон или `externalId` записи есть в suppression tenant.
- Подключить в engine и sandbox-start.

Где менять:

- `src/compliance/rules/suppression.ts`
- `src/compliance/engine/compliance-engine.ts`
- `src/routes/calls.ts`
- `tests/compliance/suppression.test.ts`

Критерии готовности:

- Совпадение по телефону и по `externalId` даёт `SUPPRESSION_BLOCK`.
- Отсутствие в списке не блокирует само по себе.
- `npm run test -- tests/compliance/suppression.test.ts` проходит.

Результат:
- `SuppressionRule` + in-memory lookup; пустой список = allow.
- Подключено в default engine sandbox/compliance.

Изменено:
- `src/compliance/rules/suppression.ts`
- `src/routes/calls.ts`
- `src/routes/compliance.ts`
- `tests/compliance/suppression.test.ts`
- `tests/compliance/api-check.test.ts`

Контекст для следующих задач:
- Persist lookup из Prisma — отдельная задача, если появится API списка.
- `obligationId` используется как `externalId` для сверки.

## P1. Rulebook v1: live-гейты

### T-138: Добавить legalBasisStatus на tenant

Статус: `done`

Что сделать:

- Поле `legalBasisStatus`: `pending` | `confirmed` | `revoked`, по умолчанию `pending`.
- Не давать campaign manager менять его через API кампаний. В этой задаче достаточно схемы и чтения; запись — только через код/seed/явный admin-путь, если он уже есть.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/tenant/index.ts`

Критерии готовности:

- Новые tenant создаются с `pending`.
- Поле есть в доменном типе.
- Миграция применяется.

Результат:
- Prisma default `pending`; API кампаний поле не пишет.
- Billing settings не экспортирует и не меняет legal basis.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0018_add_tenant_legal_basis_status/migration.sql`
- `src/domain/tenant/index.ts`
- `tests/domain-tenant.test.ts`

Контекст для следующих задач:
- `T-139` должен блокировать production-ready при не-`confirmed`.
- Менять статус может только будущий admin/seed, не collection_manager.

### T-139: Блокировать production-ready без legalBasis=confirmed

Статус: `done`

Что сделать:

- В `readiness-summary` добавлять blocking reason, если у tenant не `legalBasisStatus=confirmed` и кампания претендует на production-телефонию.
- Не менять sandbox-ready: sandbox соединение не требует legal basis.

Где менять:

- `src/routes/campaigns.ts`
- `tests/campaigns.create.test.ts`
- `docs/campaign-readiness-api.md`

Критерии готовности:

- Production connection + `pending` legal basis → `blocked` с понятным `reasonCode`.
- Только sandbox connection → legal basis не блокирует.
- `npm run test -- tests/campaigns.create.test.ts` проходит.

Результат:
- Production + не-`confirmed` → `LEGAL_BASIS_NOT_CONFIRMED`.
- Sandbox connection: legal reason не добавляется (может остаться `PRODUCTION_TELEPHONY_MISSING`).
- Отсутствие поля трактуется как `pending`.

Изменено:
- `src/campaigns/readiness.ts`
- `tests/campaigns.create.test.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/campaign-readiness-api.md`
- `docs/compliance/rulebook-v1.md`

Контекст для следующих задач:
- Live adapter (`T-140+`) не обходит этот gate.
- Тестовые фикстуры sandbox с production connection ставят `legalBasisStatus=confirmed`.

### T-140: Расширить adapter контрактом capabilities probe

Статус: `done`

Что сделать:

- Добавить в `VoiceProviderAdapter` метод `probeCapabilities()`: `marking`, `recording`, `handoff`, `checkedAt`.
- Sandbox возвращает все `false` либо явный sandbox-pass, но не притворяется live-маркировкой.

Где менять:

- `src/telephony/voice-provider/adapter.ts`
- `src/telephony/sandbox-provider/index.ts`
- `tests/telephony/voice-provider.test.ts`
- `docs/integrations/voice-provider-adapter.md`

Критерии готовности:

- Контракт и sandbox реализованы.
- Доменные типы без vendor-полей.
- `npm run test -- tests/telephony` проходит.

Результат:
- `probeCapabilities()` на адаптере.
- Sandbox: `marking/recording/handoff=false`, `sandboxPass=true`.

Изменено:
- `src/telephony/voice-provider/adapter.ts`
- `src/telephony/sandbox-provider/index.ts`
- `tests/telephony/sandbox-provider.test.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/integrations/voice-provider-adapter.md`

Контекст для следующих задач:
- `T-141` должен требовать marking/recording/handoff только для production; `sandboxPass` не считать live-маркировкой.

### T-141: Требовать marking/recording/handoff в readiness для production

Статус: `done`

Что сделать:

- Для `TelephonyConnection.mode=production` readiness блокируется, пока probe не подтвердил marking, recording и handoff.
- Сохранять время последней проверки.

Где менять:

- `src/routes/campaigns.ts`
- `src/domain/telephony-connection/index.ts`
- `tests/campaigns.create.test.ts`
- `docs/campaign-readiness-api.md`

Критерии готовности:

- Production без probe → `blocked`.
- Sandbox не требует live marking.
- `npm run test -- tests/campaigns.create.test.ts` проходит.

Результат:
- Production без `lastProbeAt` или без тройки marking/recording/handoff → `TELEPHONY_PROBE_INCOMPLETE`.
- `sandboxPass=true` при false-флагах не открывает production readiness.
- Sandbox-соединение probe не требует (остаётся `PRODUCTION_TELEPHONY_MISSING`, если нет production).
- Время проверки хранится в `TelephonyConnection.lastProbeAt`; `applyTelephonyProbeResult` копирует флаги и игнорирует `sandboxPass` как подтверждение.

Изменено:
- `src/domain/telephony-connection/index.ts`
- `src/campaigns/readiness.ts`
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0019_add_telephony_probe_result/migration.sql`
- `tests/domain-telephony-connection.test.ts`
- `tests/campaigns.create.test.ts`
- `tests/calls/sandbox-call.api.test.ts` (фикстура production probe, иначе sandbox 409)
- `docs/campaign-readiness-api.md`

Контекст для следующих задач:
- Probe HTTP ещё нет: поля пишутся через `applyTelephonyProbeResult`, пока только тестами/будущим probe API.
- `src/routes/campaigns.ts` уже отдаёт `evaluateCampaignReadiness`; логика gate живёт в `src/campaigns/readiness.ts`.
- Live-звонок и T-146 должны уважать тот же stored probe, не `sandboxPass`.

### T-142: Запретить смену провайдера у running-кампании

Статус: `done`

Что сделать:

- Если у кампании появится поле соединения — запретить менять его в `running` / `auto_paused`.
- Если поля ещё нет: зафиксировать в API telephony, что `provider` у используемого соединения нельзя сменить, пока есть `running` кампании tenant на этом соединении.

Где менять:

- `src/routes/telephony.ts`
- `src/routes/campaigns.ts`
- `tests/telephony.routes.test.ts`

Критерии готовности:

- Попытка сменить provider на активном контуре с running-кампанией возвращает ошибку, не 200.
- Audit не пишет успешную смену.
- `npm run test -- tests/telephony.routes.test.ts` проходит.

Результат:
- `PATCH .../campaigns/:id/telephony-connection` уже отдавал `409 TELEPHONY_CONNECTION_LOCKED` на `running`; добавлен тот же lock для `auto_paused`.
- `PATCH .../telephony-connections/:connectionId` меняет `provider`/`displayName`/`status`.
- Смена `provider` при кампаниях `running`/`auto_paused` на этом соединении → `409 TELEPHONY_PROVIDER_LOCKED`, без update и без audit.

Изменено:
- `src/routes/telephony.ts`
- `tests/telephony.routes.test.ts`
- `tests/campaigns.create.test.ts`
- `docs/telephony-api.md`

Контекст для следующих задач:
- `mode` через PATCH не меняется (отдельный контур sandbox vs production).
- Смена провайдера на draft/review/ready разрешена.

### T-143: Зафиксировать locked disclosure в ScriptVersion

Статус: `done`

Что сделать:

- В `content` (или отдельных полях) обязать `agentName`, `agentId`, `creditorName`.
- Создание версии без них — валидационная ошибка.
- Не проверять «человечность» формулировок LLM в этой задаче.

Где менять:

- `src/routes/scripts.ts`
- `src/domain/script-version/index.ts`
- `tests/scripts.api.test.ts`

Критерии готовности:

- POST без трёх полей → `VALIDATION_ERROR`.
- POST с полями создаёт версию.
- `npm run test -- tests/scripts.api.test.ts` проходит.

Результат:
- `content` — JSON-объект; обязательны непустые `agentName`, `agentId`, `creditorName` (`isLockedDisclosureContent`).
- Строка или объект без полей → `400 VALIDATION_ERROR`, версия не создаётся.
- В БД по-прежнему `content` TEXT: `serializeScriptContent` пишет JSON.

Изменено:
- `src/domain/script-version/index.ts`
- `src/routes/scripts.ts`
- `tests/domain-script-version.test.ts`
- `tests/scripts.api.test.ts`

Контекст для следующих задач:
- Доп. поля сценария можно класть рядом в тот же объект (`passthrough` не нужен: проверка только трёх ключей).
- Человечность формулировок не валидируется.

## P1. ADR 0003: live voice provider

Источник: `docs/decisions/0003-live-voice-provider.md`. Боевой HTTP к Exolve не делать, пока нет DPA/секретов (`T-149`).

### T-144: Добавить providerResolver

Статус: `done`

Что сделать:

- Выбирать адаптер по `TelephonyConnection.provider`: `sandbox` → sandbox, иное неизвестное → ошибка, не fallback на live.
- Подключить в sandbox-call так, чтобы явный sandbox provider продолжал работать.

Где менять:

- `src/telephony/voice-provider/resolver.ts`
- `src/routes/calls.ts`
- `src/server/app.ts`
- `tests/telephony/provider-resolver.test.ts`

Критерии готовности:

- Неизвестный provider не стартует звонок.
- `sandbox` резолвится в `SandboxVoiceProvider`.
- `npm run test -- tests/telephony/provider-resolver.test.ts tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- `createVoiceProviderResolver({ sandbox })`; неизвестное имя → `UnknownVoiceProviderError`, sandbox-call `422 UNKNOWN_VOICE_PROVIDER`, без `CallAttempt`.
- Отсутствующий `provider` на соединении трактуется как `sandbox`.
- Тестовый `voiceProvider` остаётся sandbox-адаптером в resolver из `app.ts`.

Изменено:
- `src/telephony/voice-provider/resolver.ts`
- `src/routes/calls.ts`
- `src/server/app.ts`
- `tests/telephony/provider-resolver.test.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `docs/integrations/voice-provider-adapter.md`

Контекст для следующих задач:
- Exolve/Mango в resolver не добавлять, пока адаптер не готов (T-145/T-195). Неизвестный live не должен тихо уходить в sandbox.

### T-145: Скелет адаптера Exolve без сети

Статус: `done`

Что сделать:

- Модуль `src/telephony/exolve/` реализует `VoiceProviderAdapter`.
- Без реальных HTTP-вызовов: детерминированные ошибки «not configured», если нет env, либо test double.
- `mapVendorStatus` для типичных статусов Exolve, без vendor-полей в домене.

Где менять:

- `src/telephony/exolve/*`
- `tests/telephony/exolve-adapter.test.ts`
- `.env.example` (пустые `EXOLVE_*`)

Критерии готовности:

- Адаптер компилируется и покрыт тестом маппинга статусов.
- Секретов в репозитории нет.
- `npm run test -- tests/telephony/exolve-adapter.test.ts` проходит.

Результат:
- `ExolveVoiceProvider` + `mapVendorStatus`; start/status/hangup без HTTP → `ExolveNotConfiguredError` (`not configured`).
- Probe не заявляет live marking (`sandboxPass=false`).
- В resolver не регистрировался (unknown `exolve` по-прежнему 422).

Изменено:
- `src/telephony/exolve/index.ts`
- `tests/telephony/exolve-adapter.test.ts`
- `.env.example` (`EXOLVE_API_KEY`, `EXOLVE_APPLICATION_ID` пустые)

Контекст для следующих задач:
- HTTP Exolve = `T-149` blocked. Не добавлять `exolve` в resolver до конфигурируемого адаптера.

### T-146: Не стартовать production-звонок через sandbox API

Статус: `done`

Что сделать:

- `POST .../calls/sandbox` работает только с `mode=sandbox`.
- Если единственное/выбранное соединение `production` — 409/422 с явным кодом, без `CallAttempt`.

Где менять:

- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Sandbox + sandbox connection → как сейчас, плюс compliance.
- Production connection → звонок не стартует этим маршрутом.
- `npm run test -- tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- Production на sandbox-маршруте → `409 SANDBOX_CONNECTION_REQUIRED`, без `CallAttempt`.
- Readiness для sandbox-канала не требует production/probe/legalBasis (`evaluateCampaignReadiness(..., { channel: 'sandbox' })`).
- Launch/readiness-summary без `channel` по-прежнему требует production.

Изменено:
- `src/routes/calls.ts`
- `src/campaigns/readiness.ts`
- `tests/calls/sandbox-call.api.test.ts`

Контекст для следующих задач:
- Live-маршрут должен использовать `channel: 'live'` (дефолт) и production connection + probe.
- T-147 описывает контракт live API, код маршрута не писать.

### T-147: Описать контракт live-call API без реализации вендора

Статус: `done`

Что сделать:

- Route-level документ будущего `POST .../calls/live`: compliance gate, legalBasis, production connection, probe, adapter.
- Явно написать, что вендорский робот не используется.

Где менять:

- `docs/calls-api.md`
- `docs/integrations/voice-provider-adapter.md`

Критерии готовности:

- В документации есть отличия sandbox vs live.
- Есть список fail-closed условий из rulebook/ADR 0003.
- Код live-маршрута в этой задаче не пишется.

Результат:
- Таблица sandbox vs live и черновик `POST .../calls/live` с fail-closed списком.
- Явный запрет вендорского робота как мозга диалога.
- Код маршрута не добавлялся.

Изменено:
- `docs/calls-api.md`
- `docs/integrations/voice-provider-adapter.md`

Контекст для следующих задач:
- T-148 вводит `LIVE_CALLS_ENABLED`; live-маршрут должен читать флаг из одного места.

### T-148: Feature-flag LIVE_CALLS_ENABLED

Статус: `done`

Что сделать:

- Env `LIVE_CALLS_ENABLED` по умолчанию `false`.
- Даже при появлении live-маршрута позже флаг запрещает старт, если `false`.
- Сейчас достаточно валидации env и проверки в одном месте, которое будут использовать следующие задачи.

Где менять:

- `src/config/env.ts`
- `.env.example`
- `tests/config/env.test.ts` или существующий конфиг-тест, если есть

Критерии готовности:

- По умолчанию live выключен.
- Невалидное значение env не стартует процесс без ошибки валидации Zod.
- Секретов в примере нет.

Результат:
- `LIVE_CALLS_ENABLED` только `'true'|'false'`, default false; иное → Zod throw при parse.
- Единая проверка: `isLiveCallsEnabled()`.

Изменено:
- `src/config/env.ts`
- `.env.example`
- `tests/config/env.test.ts`

Контекст для следующих задач:
- Live-маршрут обязан вызывать `isLiveCallsEnabled()` до адаптера. Не использовать `z.coerce.boolean()`.

### T-149: HTTP-интеграция Exolve start/status/hangup

Статус: `blocked`

Что сделать:

- Реальные вызовы Exolve Voice API за адаптером.
- Идемпотентность webhook/status.
- Нужны DPA, маркировка, recording, transfer, секреты вне git.

Где менять:

- `src/telephony/exolve/*`
- `tests/telephony/exolve-adapter.test.ts`

Критерии готовности:

- Контракт adapter соблюдён на тестовом номере.
- ПДн не логируются целиком.
- Задача не берётся, пока нет доступа/договора.

Блокер: коммерция/DPA и тестовый аккаунт Exolve (ADR 0003).

## P1. ADR 0004: ASR, TTS, LLM

Источник: `docs/decisions/0004-speech-llm-stack.md`. Иностранные cloud-модели не подключать.

### T-150: Контракт ASR adapter

Статус: `done`

Что сделать:

- Интерфейс streaming/partials/confidence/timestamps без привязки к Яндексу в домене.
- Fake-реализация для тестов.

Где менять:

- `src/speech/asr/adapter.ts`
- `src/speech/asr/fake.ts`
- `tests/speech/asr-adapter.test.ts`
- `docs/integrations/speech-adapters.md`

Критерии готовности:

- Fake возвращает детерминированный текст и confidence.
- Нет сетевых вызовов в unit-тестах.
- `npm run test -- tests/speech/asr-adapter.test.ts` проходит.

Результат:
- Доменный `AsrAdapter` с partials/confidence/timestamps; `FakeAsrAdapter` без сети.

Изменено:
- `src/speech/asr/adapter.ts`
- `src/speech/asr/fake.ts`
- `tests/speech/asr-adapter.test.ts`
- `docs/integrations/speech-adapters.md`

Контекст для следующих задач:
- HTTP SpeechKit = T-157 blocked. Factory T-176 после TTS/LLM контрактов.

### T-151: Контракт TTS adapter

Статус: `done`

Что сделать:

- Интерфейс синтеза с `voiceId` и версией голоса.
- Fake, который не пишет файлы наружу (buffer/stub url).

Где менять:

- `src/speech/tts/adapter.ts`
- `src/speech/tts/fake.ts`
- `tests/speech/tts-adapter.test.ts`
- `docs/integrations/speech-adapters.md`

Критерии готовности:

- Контракт и fake покрыты тестом.
- Vendor-поля не протекают в домен.
- `npm run test -- tests/speech/tts-adapter.test.ts` проходит.

Результат:
- `TtsAdapter.synthesize({ text, voiceId, voiceVersion })` → buffer + `memory://` url.

Изменено:
- `src/speech/tts/adapter.ts`
- `src/speech/tts/fake.ts`
- `tests/speech/tts-adapter.test.ts`
- `docs/integrations/speech-adapters.md`

### T-152: Контракт LLM adapter и allowlisted tools

Статус: `done`

Что сделать:

- Интерфейс `completeTurn` со схемой tools: `set_outcome`, `request_handoff`, `schedule_callback`, `end_call`, `confirm_ptp`.
- `confirm_ptp` нельзя вызывать, пока контекст не содержит `identityVerified=true`.
- Fake LLM для тестов.

Где менять:

- `src/dialogue/llm/adapter.ts`
- `src/dialogue/llm/fake.ts`
- `src/dialogue/llm/tools.ts`
- `tests/dialogue/llm-adapter.test.ts`

Критерии готовности:

- Fake не может вернуть `confirm_ptp` без identity gate на уровне типов/рантайм-проверки адаптера.
- `npm run test -- tests/dialogue/llm-adapter.test.ts` проходит.

Результат:
- Allowlist в `LLM_TOOLS`; `assertToolAllowed` бросает `IdentityGateError` для `confirm_ptp` без `identityVerified`.
- Fake вызывает gate до возврата tool.

Изменено:
- `src/dialogue/llm/adapter.ts`
- `src/dialogue/llm/fake.ts`
- `src/dialogue/llm/tools.ts`
- `tests/dialogue/llm-adapter.test.ts`

### T-153: Схема PromptVersion

Статус: `done`

Что сделать:

- Tenant/campaign-scoped версия промпта: `version`, `status`, hashes/content, `modelId`, связь с `ScriptVersion` если уместно.
- Не класть секреты модели в таблицу.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/prompt-version/index.ts`

Критерии готовности:

- Модель и миграция существуют.
- Уникальность версии в рамках кампании.
- Доменный тип описан.

Результат:
- `PromptVersion` + unique `(campaignId, version)`; секретов модели нет (`modelId` без ключа).
- Миграция `0020_init_prompt_version`.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0020_init_prompt_version/migration.sql`
- `src/domain/prompt-version/index.ts`
- `tests/domain-prompt-version.test.ts`

### T-154: Описать state machine диалога

Статус: `done`

Что сделать:

- Документ шагов: identity → disclosure → purpose → ptp_or_decline → confirm → end/handoff.
- Для каждого шага: разрешённые tools, запрет суммы до identity, locked disclosure.

Где менять:

- `docs/dialogue/state-machine-v1.md`

Критерии готовности:

- Есть перечень состояний и переходов.
- Явно указано, что LLM не стартует звонок и не меняет compliance decision.
- Документ ссылается на rulebook R-IDENTITY / R-AI-DISCLOSURE / R-LLM-NOT-JUDGE.

Результат:
- `docs/dialogue/state-machine-v1.md`: состояния, tools, запрет суммы до identity, LLM не стартует звонок.

Изменено:
- `docs/dialogue/state-machine-v1.md`

### T-155: Скелет DialogueStateMachine без вендора

Статус: `done`

Что сделать:

- Чистые переходы состояния по событиям (`user_said`, `tool_result`, `handoff_requested`).
- На шаге identity контекст для LLM не содержит `debtAmount`.
- Тесты переходов без ASR/TTS.

Где менять:

- `src/dialogue/state-machine.ts`
- `tests/dialogue/state-machine.test.ts`

Критерии готовности:

- Нельзя перейти к раскрытию суммы, пока identity не `verified`.
- Запрос человека переводит в `handoff`.
- `npm run test -- tests/dialogue/state-machine.test.ts` проходит.

Результат:
- `transitionDialogue` / `buildLlmTurnPayload`: сумма не в контексте identity/disclosure; handoff по событию.

Изменено:
- `src/dialogue/state-machine.ts`
- `tests/dialogue/state-machine.test.ts`

### T-156: Скелет адаптера Yandex SpeechKit/GPT без сети

Статус: `done`

Что сделать:

- Модули `src/speech/yandex/` и `src/dialogue/llm/yandexgpt.ts` с «not configured» без HTTP, по аналогии с Exolve skeleton.
- Env-ключи только в `.env.example`.
- Не читать `process.env` из адаптера, если уже есть `T-176`: ключ приходит из resolver.

Где менять:

- `src/speech/yandex/*`
- `src/dialogue/llm/yandexgpt.ts`
- `.env.example`
- `tests/speech/yandex-skeleton.test.ts`

Критерии готовности:

- Без ключей адаптер не ходит в сеть и возвращает контролируемую ошибку.
- Нет иностранных SDK.
- `npm run test -- tests/speech/yandex-skeleton.test.ts` проходит.

Результат:
- Yandex ASR/TTS/GPT скелеты принимают config, без `process.env` внутри адаптера; `YandexNotConfiguredError`.
- Пустые `YANDEX_API_KEY` / `YANDEX_FOLDER_ID`.

Изменено:
- `src/speech/yandex/*`
- `src/dialogue/llm/yandexgpt.ts`
- `tests/speech/yandex-skeleton.test.ts`
- `.env.example`

### T-157: HTTP SpeechKit + YandexGPT

Статус: `blocked`

Что сделать:

- Боевые streaming ASR/TTS и completeTurn к Yandex.
- Нужны DPA, ключи, замер WER/latency на корпусе.

Где менять:

- `src/speech/yandex/*`
- `src/dialogue/llm/yandexgpt.ts`

Критерии готовности:

- ПДн не уходят вне РФ-контура вендора.
- Адаптеры соответствуют T-150…T-152.
- Задача не берётся без договора/ключей.

Блокер: DPA и ключи Yandex Cloud (ADR 0004).

## P2. Оркестратор звонков

Нужен для live-обзвона, не для текущего sandbox POST.

### T-158: Добавить docker-compose для PostgreSQL и Redis

Статус: `done`

Что сделать:

- `docker-compose.yml`: PostgreSQL 16 и Redis.
- Обновить README локального запуска, чтобы `docker compose up -d` из ADR 0001 стал правдой.

Где менять:

- `docker-compose.yml`
- `README.md`
- `.env.example`

Критерии готовности:

- Compose поднимает PG на `DATABASE_URL` из примера.
- Redis доступен локально без секретов в git.
- Документация запуска совпадает с файлами.

Результат:
- Compose: Postgres 16 + Redis 7. `DATABASE_URL` / `REDIS_URL` в `.env.example` без секретов.

Изменено:
- `docker-compose.yml`
- `README.md`
- `.env.example`

### T-159: Подключить BullMQ worker skeleton

Статус: `done`

Что сделать:

- Зависимости Redis/BullMQ.
- Worker, который пока только health/ping и не звонит.
- Не ломать `npm run test` без Redis: в unit-тестах не требовать живой Redis, либо skip по env.

Где менять:

- `package.json`
- `src/jobs/queue.ts`
- `src/jobs/worker.ts`
- `tests/jobs/queue.test.ts`

Критерии готовности:

- Очередь создаётся в коде.
- Тесты не ходят в боевую телефонию.
- `npm run typecheck` проходит.

Результат:
- `bullmq` + `ioredis`; `createQueue` / ping job / `processHealthPing` без живого Redis в unit-тестах.
- `tsc --noEmit` по-прежнему красный на старых ошибках (не jobs); проверка задач: `npm run test -- tests/jobs/queue.test.ts`.

Изменено:
- `package.json`
- `src/jobs/queue.ts`
- `src/jobs/worker.ts`
- `tests/jobs/queue.test.ts`

### T-160: Ставить sandbox-звонок в очередь только по флагу

Статус: `done`

Что сделать:

- Опционально enqueue sandbox start, по умолчанию оставить синхронный путь.
- Если кампания `auto_paused`/`completed`/`archived` — job не стартует звонок.

Где менять:

- `src/jobs/*`
- `src/routes/calls.ts`
- `src/domain/campaign-auto-pause/index.ts`
- `tests/jobs/call-jobs.test.ts`

Критерии готовности:

- Автопауза предотвращает выполнение job.
- Синхронный sandbox без флага не сломан.
- `npm run test -- tests/jobs/call-jobs.test.ts tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- `SANDBOX_CALLS_QUEUE_ENABLED` default false; sync sandbox сохранён.
- Флаг on → `202 queued` без `startCall`. Job skip для `auto_paused`/`completed`/`archived`.

Изменено:
- `src/config/env.ts`
- `src/jobs/sandbox-enqueue.ts`
- `src/jobs/worker.ts`
- `src/routes/calls.ts`
- `tests/jobs/call-jobs.test.ts`
- `tests/calls/sandbox-call.api.test.ts`

## P1. BYOK: ключи ASR, TTS, LLM

Источник: `docs/decisions/0005-byok-speech-llm.md`, `docs/superpowers/specs/2026-08-17-byok-speech-llm-design.md`. UI — `T-181`–`T-183`. Не подключать иностранные cloud-провайдеры.

### T-161: Зафиксировать ADR и спеку BYOK

Статус: `done`

Что сделать:

- Зафиксировать решение: tenant BYOK для ASR/TTS/LLM, allowlist ADR 0004, envelope encryption, fail-closed, без fallback на ключ платформы.
- Разложить реализацию на задачи 1 SP.

Где менять:

- `docs/decisions/0005-byok-speech-llm.md`
- `docs/superpowers/specs/2026-08-17-byok-speech-llm-design.md`
- `TECH_BACKLOG_1SP.md`
- `DESIGN_BACKLOG_1SP.md`

Критерии готовности:

- Есть ADR со статусом «принято как направление».
- Есть спека с моделью, API, resolver и списком 1 SP.
- Секреты не предлагается хранить в `ProviderCredential` plaintext.

### T-162: Описать домен ProviderCredential

Статус: `done`

Что сделать:

- Добавить сущности `ProviderCredential` и `CredentialSecret` в доменную модель.
- Указать unique `(tenantId, capability)`, отсутствие секрета в публичной модели, связи с Tenant.

Где менять:

- `docs/domain-model.md`

Критерии готовности:

- Обе сущности описаны с полями из спеки BYOK.
- Явно написано, что ciphertext не отдаётся API.

Результат:
- Добавлены `ProviderCredential` и `CredentialSecret` с полями из спеки.
- Unique `(tenantId, capability)`; ciphertext/nonce/authTag/plaintext не отдаются API.
- Tenant 1:N ProviderCredential; ERD обновлён.

Изменено:
- `docs/domain-model.md`

Контекст для следующих задач:
- Секрет живёт только в `CredentialSecret`, не в публичном типе credential.

### T-163: Схема Prisma ProviderCredential и CredentialSecret

Статус: `done`

Что сделать:

- Enum-ы capability/provider/mode/status/probeResult по спеке.
- Модели, unique `(tenantId, capability)`, 1:1 secret, cascade delete.
- Миграция. Не класть apiKey в `ProviderCredential`.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/provider-credential/index.ts`

Критерии готовности:

- Миграция применяется на пустую БД.
- Доменный тип без поля секрета.
- `npm run typecheck` проходит.

Результат:
- Enum-ы SpeechCapability/SpeechProvider/CredentialMode/CredentialStatus/ProbeResult.
- 1:1 `CredentialSecret` с cascade; unique `(tenantId, capability)`.
- Доменный тип без `apiKey`.
- `prisma generate` проходит. `typecheck` по-прежнему красный на старых ошибках вне этой задачи.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0021_init_provider_credential/migration.sql`
- `src/domain/provider-credential/index.ts`
- `tests/domain-provider-credential.test.ts`

Контекст для следующих задач:
- List/GET не должен `select` ciphertext.

### T-164: Envelope AES-256-GCM

Статус: `done`

Что сделать:

- `encryptSecret` / `decryptSecret` / `secretHintFromKey`.
- Ключ 32 байта из аргумента функции, не из глобального синглтона в тестах.

Где менять:

- `src/secrets/envelope.ts`
- `tests/secrets/envelope.test.ts`

Критерии готовности:

- Roundtrip совпадает.
- Чужой nonce/ключ/битый tag бросает ошибку, не возвращает мусор.
- Hint для ключа длиннее 4 символов — последние 4.
- `npm run test -- tests/secrets/envelope.test.ts` проходит.

Результат:
- AES-256-GCM; nonce 12 / authTag 16; DEK передаётся аргументом.
- Hint: последние 4, иначе `****`.
- Тесты roundtrip / foreign nonce / foreign key / tampered tag проходят.

Изменено:
- `src/secrets/envelope.ts`
- `tests/secrets/envelope.test.ts`

Контекст для следующих задач:
- Не читать DEK из `process.env` внутри envelope.

### T-165: Env ключа шифрования и platform speech keys

Статус: `done`

Что сделать:

- `CREDENTIALS_ENCRYPTION_KEY` обязателен в `production` (hex 64).
- В `.env.example` пустые `YANDEX_SPEECHKIT_API_KEY`, `YANDEXGPT_API_KEY`, `GIGACHAT_API_KEY`, `YANDEX_FOLDER_ID`.
- В `test` ключ шифрования может иметь fixture, если Zod это явно допускает.

Где менять:

- `src/config/env.ts`
- `.env.example`
- `tests/config/env.test.ts`

Критерии готовности:

- Production без encryption key не стартует.
- В примере нет реальных секретов.
- `npm run test -- tests/config/env.test.ts` проходит.

Результат:
- Production без hex-64 ключа не парсится.
- Test fixture `TEST_CREDENTIALS_ENCRYPTION_KEY` (`a`×64) при пустом ключе.
- Пустые platform speech env в `.env.example`.

Изменено:
- `src/config/env.ts`
- `.env.example`
- `tests/config/env.test.ts`

Контекст для следующих задач:
- Resolver читает `YANDEX_SPEECHKIT_API_KEY` / `YANDEXGPT_API_KEY` / `GIGACHAT_API_KEY`, не `YANDEX_API_KEY`.

### T-166: Allowlist capability × provider

Статус: `done`

Что сделать:

- Чистая функция: asr/tts только `yandex_speechkit`; llm только `yandexgpt` или `gigachat`.
- `openai`, `anthropic`, `google`, `deepgram` → not allowed.

Где менять:

- `src/speech/credentials/allowlist.ts`
- `tests/speech/credentials-allowlist.test.ts`

Критерии готовности:

- Разрешённые пары проходят, иностранные — нет.
- Нет сетевых вызовов.
- `npm run test -- tests/speech/credentials-allowlist.test.ts` проходит.

Результат:
- `isSpeechProviderAllowed`; иностранные провайдеры отклоняются без сети.

Изменено:
- `src/speech/credentials/allowlist.ts`
- `tests/speech/credentials-allowlist.test.ts`

Контекст для следующих задач:
- API create должен звать allowlist до записи (`422 PROVIDER_NOT_ALLOWED`).

### T-167: Credential secret store

Статус: `done`

Что сделать:

- put/get/delete ciphertext по `providerCredentialId` с фильтром `tenantId`.
- get другого tenant возвращает empty, не чужой секрет.

Где менять:

- `src/secrets/credential-store.ts`
- `tests/secrets/credential-store.test.ts`

Критерии готовности:

- Cross-tenant read не возвращает строку.
- Delete каскадно безопасен для тестов на fake prisma/in-memory.
- `npm run test -- tests/secrets/credential-store.test.ts` проходит.

Результат:
- In-memory put/get/delete с фильтром `tenantId`; Prisma adapter для runtime.
- Cross-tenant get возвращает `null`.

Изменено:
- `src/secrets/credential-store.ts`
- `tests/secrets/credential-store.test.ts`

Контекст для следующих задач:
- Resolver и API ходят только через `CredentialSecretStore`.

### T-168: Resolver platform vs byok

Статус: `done`

Что сделать:

- Реализовать `resolveSpeechCredential` по спеке: platform env, byok decrypt, disable/invalid/missing.
- Decrypt fail → `SPEECH_CREDENTIAL_DECRYPT_FAILED`, без fallback на platform.

Где менять:

- `src/speech/credentials/resolve.ts`
- `tests/speech/credentials-resolve.test.ts`

Критерии готовности:

- Покрыты platform, byok, disabled, decrypt fail, missing.
- `npm run test -- tests/speech/credentials-resolve.test.ts` проходит.

Результат:
- Platform env / byok decrypt / disabled / invalid / missing / decrypt fail без fallback.

Изменено:
- `src/speech/credentials/resolve.ts`
- `tests/speech/credentials-resolve.test.ts`

Контекст для следующих задач:
- Probe и live guard используют `requireActive`; probe — `false`.

### T-169: API создания и списка ProviderCredential

Статус: `done`

Что сделать:

- `POST` и `GET /tenants/:tenantId/provider-credentials`.
- POST byok пишет secret store; ответ без `apiKey`.
- Повтор на ту же capability → `409 CREDENTIAL_ALREADY_EXISTS`.
- Allowlist до записи.

Где менять:

- `src/routes/provider-credentials.ts`
- `src/server/app.ts`
- `tests/provider-credentials.api.test.ts`

Критерии готовности:

- Tenant isolation как у telephony API.
- GET не содержит ciphertext/apiKey.
- `npm run test -- tests/provider-credentials.api.test.ts` проходит.

Результат:
- POST/GET без секрета; unique capability → `409`; openai → `422 PROVIDER_NOT_ALLOWED`.

Изменено:
- `src/routes/provider-credentials.ts`
- `src/server/app.ts`
- `tests/provider-credentials.api.test.ts`

### T-170: API ротации и disable

Статус: `done`

Что сделать:

- `PATCH /tenants/:tenantId/provider-credentials/:id` — metadata и/или новый `apiKey`.
- Ротация сбрасывает статус в `pending_probe` и меняет `secretHint`.
- `POST .../disable` → `disabled`; resolver больше не отдаёт ключ.

Где менять:

- `src/routes/provider-credentials.ts`
- `tests/provider-credentials.api.test.ts`

Критерии готовности:

- Старый ciphertext недоступен после ротации.
- Disable даёт ошибку resolve в тесте resolver+store.
- `npm run test -- tests/provider-credentials.api.test.ts tests/speech/credentials-resolve.test.ts` проходит.

Результат:
- PATCH ротация меняет ciphertext и `secretHint`; disable → `SPEECH_CREDENTIAL_DISABLED`.

Изменено:
- `src/routes/provider-credentials.ts`
- `tests/provider-credentials.api.test.ts`

### T-171: Audit trail credentials

Статус: `done`

Что сделать:

- Писать `provider_credential.created|updated|rotated|disabled`.
- Metadata: capability, provider, mode, secretHint, status. Без ключа и ciphertext.

Где менять:

- `src/routes/provider-credentials.ts`
- `tests/provider-credentials.api.test.ts`

Критерии готовности:

- Create/rotate/disable оставляют audit.
- Тест проверяет, что metadata не содержит исходный `apiKey`.
- `npm run test -- tests/provider-credentials.api.test.ts` проходит.

Результат:
- Audit created/rotated/disabled без `apiKey` в metadata.

Изменено:
- `src/routes/provider-credentials.ts`
- `tests/provider-credentials.api.test.ts`

### T-172: RBAC для credentials API

Статус: `done`

Что сделать:

- Write: `owner`, `integration_admin`.
- Read: плюс `collection_manager`.
- `operator` / `qa_analyst` → 403.

Где менять:

- `src/routes/provider-credentials.ts`
- `docs/security/rbac.md`
- `tests/provider-credentials.api.test.ts`

Критерии готовности:

- 401 без роли, 403 чужой роли, 201 у owner.
- Матрица RBAC обновлена.
- `npm run test -- tests/provider-credentials.api.test.ts` проходит.

Результат:
- Write: owner/integration_admin; read + collection_manager; operator/qa → 403.
- Матрица и endpoint-level RBAC обновлены.

Изменено:
- `src/routes/provider-credentials.ts`
- `docs/security/rbac.md`
- `tests/provider-credentials.api.test.ts`

### T-173: Документация Provider Credentials API

Статус: `done`

Что сделать:

- Route-level документ по образцу `docs/telephony-api.md`.
- Ссылка в README.

Где менять:

- `docs/provider-credentials-api.md`
- `README.md`

Критерии готовности:

- Описаны POST/GET/PATCH/disable/probe, ошибки, RBAC, запрет секрета в ответе.

Результат:
- Route-level документ и ссылка в README.

Изменено:
- `docs/provider-credentials-api.md`
- `README.md`

### T-174: Fake probe без сети

Статус: `done`

Что сделать:

- Порт `SpeechCredentialProbe` и fake: непустой ключ + allowlist → `ok`.
- Пустой ключ или неизвестный provider → `failed`.
- HTTP к вендору нет.

Где менять:

- `src/speech/credentials/probe.ts`
- `src/speech/credentials/fake-probe.ts`
- `tests/speech/credentials-probe.test.ts`

Критерии готовности:

- Детерминированный ok/failed.
- `npm run test -- tests/speech/credentials-probe.test.ts` проходит.

Результат:
- Порт + fake probe без HTTP; пустой ключ / иностранный provider → `failed`.

Изменено:
- `src/speech/credentials/probe.ts`
- `src/speech/credentials/fake-probe.ts`
- `tests/speech/credentials-probe.test.ts`

### T-175: API probe

Статус: `done`

Что сделать:

- `POST /tenants/:tenantId/provider-credentials/:id/probe`.
- Успех → `active` + `lastProbeResult=ok`; провал → `invalid`.
- Audit `provider_credential.probed`.

Где менять:

- `src/routes/provider-credentials.ts`
- `docs/provider-credentials-api.md`
- `tests/provider-credentials.api.test.ts`

Критерии готовности:

- Probe не возвращает ключ.
- Статус меняется по результату fake probe.
- `npm run test -- tests/provider-credentials.api.test.ts` проходит.

Результат:
- Probe без ключа в ответе; ok → `active`, failed → `invalid`; audit `probed`.

Изменено:
- `src/routes/provider-credentials.ts`
- `docs/provider-credentials-api.md`
- `tests/provider-credentials.api.test.ts`

Контекст для следующих задач:
- Live HTTP SpeechKit (`T-157`) подменит fake probe, не API.

### T-176: Factory адаптеров через resolver

Статус: `done`

Что сделать:

- ASR/TTS/LLM factory принимает `ResolvedSpeechCredential`, не читает env напрямую.
- Если `T-150`–`T-152` ещё не `done`, ограничиться factory + fake adapters.
- Скелет Yandex (`T-156`) после этой задачи должен идти в resolver, а не в `process.env`.

Где менять:

- `src/speech/asr/*`
- `src/speech/tts/*`
- `src/dialogue/llm/*`
- `tests/speech/adapter-factory.test.ts`

Критерии готовности:

- Fake factory работает с резолвленным credential.
- Нет прямого `process.env.YANDEX_*` в адаптере.
- `npm run test -- tests/speech/adapter-factory.test.ts` проходит.

Результат:
- Factory ASR/TTS/LLM принимает `ResolvedSpeechCredential`; fake не читает env.
- Yandex адаптеры получают apiKey из credential.

Изменено:
- `src/speech/asr/factory.ts`
- `src/speech/tts/factory.ts`
- `src/dialogue/llm/factory.ts`
- `tests/speech/adapter-factory.test.ts`

### T-177: Fail-closed live без ключей

Статус: `done`

Что сделать:

- Общий guard `assertSpeechCredentialsReady(tenantId)` для трёх capability.
- Подключить к будущему live-старту; для sandbox+fake — skip.
- Пока live-маршрута нет — экспорт guard + unit-тест, плюс вызов-заглушка в одном месте рядом с `LIVE_CALLS_ENABLED` если флаг уже есть.

Где менять:

- `src/speech/credentials/assert-ready.ts`
- `src/routes/calls.ts` только если live/non-fake путь уже существует
- `tests/speech/assert-speech-ready.test.ts`

Критерии готовности:

- Нет ключей → ошибка `SPEECH_CREDENTIAL_MISSING`, CallAttempt не создаётся на non-fake пути.
- Fake sandbox не сломан.
- `npm run test -- tests/speech/assert-speech-ready.test.ts tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- `assertSpeechCredentialsReady` резолвит asr/tts/llm; missing → `SPEECH_CREDENTIAL_MISSING`.
- Заглушка `guardLiveSpeechCredentialsIfEnabled` рядом с `LIVE_CALLS_ENABLED`; sandbox не вызывает.

Изменено:
- `src/speech/credentials/assert-ready.ts`
- `src/routes/calls.ts`
- `tests/speech/assert-speech-ready.test.ts`

### T-178: Readiness check речи и модели

Статус: `done`

Что сделать:

- В `readiness-summary` добавить check `speech_credentials` по спеке.
- Sandbox/fake: ok. Production-ready: active BYOK или platform env.

Где менять:

- `src/routes/campaigns.ts` (readiness)
- `docs/campaign-readiness-api.md`
- `tests/campaigns.create.test.ts` или существующий readiness-тест

Критерии готовности:

- Документ и API согласованы.
- Тест на blocked без ключей в production-контуре.
- `npm run test` затронутого файла проходит.

Результат:
- Production-ready без ключей → `SPEECH_CREDENTIALS_NOT_READY`.
- Sandbox канал пропускает check.

Изменено:
- `src/campaigns/readiness.ts`
- `docs/campaign-readiness-api.md`
- `tests/campaigns.create.test.ts`

### T-179: UsageEvent.credentialMode и speech units

Статус: `done`

Что сделать:

- Enum/поле `credentialMode`: `platform` `byok` `fake`.
- Типы событий `asr_units`, `tts_units`, `llm_units`.
- Существующие sandbox события → `fake`, тесты sandbox не ломаются.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/usage-event/index.ts`
- `tests/usage.api.test.ts`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Миграция совместима с текущими rows (default `fake`).
- `npm run test -- tests/usage.api.test.ts tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- Enum `UsageCredentialMode` + `asr_units`/`tts_units`/`llm_units`; sandbox пишет `fake`.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0022_add_usage_speech_units/migration.sql`
- `src/domain/usage-event/index.ts`
- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts`

### T-180: Billing mapper исключает BYOK speech

Статус: `done`

Что сделать:

- Mapper не включает `asr_units`/`tts_units`/`llm_units` с `credentialMode=byok` в platform invoice.
- Platform mode speech единицы учитываются отдельно от connected minutes.
- Документировать в billing model v0/v1 заметке.

Где менять:

- `src/domain/billing/index.ts`
- `docs/billing/billing-model-v0.md`
- `tests/billing/*.test.ts` или существующий billing-тест

Критерии готовности:

- BYOK speech не увеличивает platform sum.
- `platform` speech суммируется.
- Тест на оба режима проходит.

Результат:
- `sumPlatformSpeechUnits` / `isPlatformBillableUsage`: byok speech не в platform invoice.

Изменено:
- `src/domain/billing/index.ts`
- `docs/billing/billing-model-v0.md`
- `tests/domain-billing.test.ts`

## P1. BYOK UI (бывшие D-014–D-016)

Канон текстов: `PRODUCT_LANGUAGE.md`, `skills/russian-product-copy`. В кабинете не писать ASR/TTS/LLM/BYOK.

### T-181: Словарь «Речь и модель»

Статус: `done`

Что сделать:

- Добавить пользовательские термины: речь и модель, свой ключ, ключ платформы, распознавание речи, голос, модель диалога, проверить подключение.
- Запретить в кабинете BYOK, ASR, TTS, LLM, API key как заголовок карточки.

Где менять:

- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- Таблица покрывает три карточки и статусы.
- Внутренние коды (`ProviderCredential`, `SPEECH_CREDENTIAL_MISSING`) не предлагаются как копирайт кабинета.

Результат:
- Таблица «Речь и модель»: три карточки, статусы, запрет BYOK/ASR/TTS/LLM в кабинете.

Изменено:
- `PRODUCT_LANGUAGE.md`

### T-182: Карточки «Речь и модель» в интеграциях

Статус: `done`

Что сделать:

- В `prototype.html` добавить блок из трёх карточек со статусами из спеки BYOK.
- Модалка: поставщик, ключ (`password`), каталог для Yandex, «Сохранить», «Проверить подключение».
- После сохранения только «ключ ···XXXX». Форму не показывать менеджеру кампании.

Где менять:

- `prototype.html`
- `tests/prototype-campaign-views.test.ts` при необходимости

Критерии готовности:

- Есть состояния: не настроено / свой ключ / ключ платформы / ошибка подключения.
- В видимом тексте нет BYOK/ASR/TTS/LLM.
- `node --check` для скрипта прототипа проходит.

Результат:
- Экран `speech` с тремя карточками и модалкой `password`; после сохранения «ключ ···XXXX».
- В секции нет BYOK/ASR/TTS/LLM.

Изменено:
- `prototype.html`
- `tests/prototype-campaign-views.test.ts`

### T-183: Readiness «Речь и модель» без формы ключа

Статус: `done`

Что сделать:

- На проверке готовности кампании строка «Речь и модель»: готово / не готово.
- Блокер: «Речь и модель не готовы. Подключите ключи в разделе интеграций.»
- Форму ключа внутри кампании не дублировать.

Где менять:

- `prototype.html`

Критерии готовности:

- Менеджер видит статус и куда идти.
- Sandbox без боевых ключей не выглядит как production-ready речь.

Результат:
- На обзоре и запуске кампании статус «Речь и модель» + ссылка в интеграции, без формы ключа.

Изменено:
- `prototype.html`

## P1. Дыры Lab относительно текущей архитектуры

Пропуски, которые уже мешают честному sandbox/readiness, без live-вендора.

### T-184: Запретить смену активного сценария на running

Статус: `done`

Что сделать:

- `POST` новой `ScriptVersion` со `status=active` (или активация) при `Campaign.status=running` → 409.
- Новая версия остаётся `draft`; кампания не переключается на лету (R-SCRIPT-VERSION).

Где менять:

- `src/routes/scripts.ts`
- `tests/scripts.api.test.ts`

Критерии готовности:

- На `running` активный сценарий не меняется.
- На `draft`/`review` создание версии работает как сейчас.
- `npm run test -- tests/scripts.api.test.ts` проходит.

Результат:
- `POST /scripts` при `Campaign.status=running` отвечает 409 `SCRIPT_VERSION_LOCKED`, не создаёт версию и не переводит кампанию в `review`.
- На `draft`/`review` создание версии работает как раньше.

Изменено:
- `src/routes/scripts.ts`
- `tests/scripts.api.test.ts`

Контекст для следующих задач:
- Отдельного endpoint активации сценария нет: lock стоит на create.
- `auto_paused` этим lock не закрыт (`T-187`).
- Смена telephony на running — отдельно в `T-142`/`T-185`.

### T-185: Привязать кампанию к TelephonyConnection

Статус: `done`

Что сделать:

- Поле `Campaign.telephonyConnectionId` (nullable FK, tenant-scoped).
- Readiness и sandbox используют выбранное соединение, а не «любое production у tenant».
- Смена на `running` запрещена (согласовать с `T-142`).

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/campaign/index.ts`
- `src/routes/campaigns.ts`
- `src/routes/calls.ts`
- `tests/campaigns.create.test.ts`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Чужой tenant connection нельзя привязать.
- Readiness смотрит на выбранное соединение.
- `npm run test -- tests/campaigns.create.test.ts tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- `Campaign.telephonyConnectionId` nullable FK, `ON DELETE SET NULL`.
- Create и `PATCH .../telephony-connection` проверяют tenant; чужой connection → 404 `TELEPHONY_CONNECTION_NOT_FOUND`.
- На `running`/`auto_paused` смена → 409 `TELEPHONY_CONNECTION_LOCKED`.
- Readiness смотрит только выбранное соединение; sandbox пишет его в `CallAttempt` (тело запроса не перебивает).

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0013_add_campaign_telephony_connection/migration.sql`
- `src/domain/campaign/index.ts`
- `src/routes/campaigns.ts`
- `src/routes/calls.ts`
- `tests/campaigns.create.test.ts`
- `tests/calls/sandbox-call.api.test.ts`

Контекст для следующих задач:
- `T-142` может опираться на `Campaign.telephonyConnectionId` вместо «любая running кампания tenant».
- Без выбранного соединения readiness = `PRODUCTION_TELEPHONY_MISSING`.
- `T-186` должен читать readiness выбранного соединения, не tenant-wide findMany.

### T-186: Sandbox-звонок уважает blocked/stale readiness

Статус: `done`

Что сделать:

- `POST .../calls/sandbox` не создаёт `CallAttempt`, если readiness кампании `blocked` или `stale`.
- Ответ 409 с кодом `CAMPAIGN_NOT_READY` и reasons из readiness-summary.

Где менять:

- `src/routes/calls.ts`
- `src/campaigns/readiness.ts`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Stale после смены сценария блокирует sandbox так же, как UI.
- Успешный текущий happy-path с ready-кампанией сохранён.
- `npm run test -- tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- Оценка readiness вынесена в `evaluateCampaignReadiness`.
- Sandbox при `blocked`/`stale` отвечает 409 `CAMPAIGN_NOT_READY` с reasons, без `CallAttempt`.
- GET readiness-summary использует тот же модуль.

Изменено:
- `src/campaigns/readiness.ts`
- `src/routes/calls.ts`
- `src/routes/campaigns.ts`
- `tests/calls/sandbox-call.api.test.ts`

Контекст для следующих задач:
- Любая новая проверка готовности должна идти через `evaluateCampaignReadiness`, не копировать правила.
- Happy-path sandbox в тестах теперь требует ready-фикстуры (должники, active script, выбранный production connection).

### T-187: Safe-resume API после автопаузы

Статус: `done`

Что сделать:

- Отдельный переход `auto_paused` → `review`/`ready` только через endpoint с чеклистом (owner или compliance_officer).
- Обычный `PATCH .../status` с `running` из `auto_paused` запрещён (сейчас машина пускает только в `review` — закрепить тестом и не открывать one-click `running`).
- Audit `campaign.safe_resumed` с пунктами чеклиста, без force-call.

Где менять:

- `src/routes/campaigns.ts`
- `docs/operations/auto-pause.md`
- `tests/campaigns.create.test.ts`
- `tests/campaign-auto-pause.test.ts`

Критерии готовности:

- Нет прямого `auto_paused` → `running`.
- Resume пишет audit.
- `npm run test -- tests/campaign-auto-pause.test.ts tests/campaigns.create.test.ts` проходит.

Результат:
- `POST .../safe-resume` (owner, compliance_officer) переводит `auto_paused` → `review`/`ready` только при полном чеклисте.
- `PATCH .../status` из `auto_paused` закрыт (в т.ч. в `review` и `running`).
- Audit `campaign.safe_resumed` с checklist и `forceCall: false`.
- Документ автопаузы синхронизирован: не one-click в `running`.

Изменено:
- `src/routes/campaigns.ts`
- `docs/operations/auto-pause.md`
- `tests/campaigns.create.test.ts`

Контекст для следующих задач:
- `collection_manager` не может safe-resume.
- После resume кампания в `review`/`ready`; controlled launch в `running` по-прежнему через status machine `ready` → `running`.

### T-188: scriptVersionId на CallAttempt

Статус: `done`

Что сделать:

- FK `CallAttempt.scriptVersionId` на активную версию кампании в момент старта.
- Sandbox пишет id; в ответе карточки звонка поле видно.
- Без активной версии — 409 `SCRIPT_VERSION_MISSING`.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/call-attempt/index.ts`
- `src/routes/calls.ts`
- `docs/calls-api.md`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Звонок хранит версию сценария (R-AUDIT).
- `npm run test -- tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- `CallAttempt.scriptVersionId` nullable FK на `ScriptVersion`.
- Sandbox берёт активную версию кампании; нет версии → 409 `SCRIPT_VERSION_MISSING`.
- Карточка звонка отдаёт `attempt.scriptVersionId`.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0014_add_call_attempt_script_version/migration.sql`
- `src/domain/call-attempt/index.ts`
- `src/routes/calls.ts`
- `docs/calls-api.md`
- `tests/calls/sandbox-call.api.test.ts`

Контекст для следующих задач:
- `findFirst` активного сценария — guard после readiness; readiness по-прежнему смотрит `findMany`.

### T-189: CI typecheck и test

Статус: `done`

Что сделать:

- GitHub Actions: `npm ci`, `npm run typecheck`, `npm run test` на pull_request и push в основную ветку.
- Без секретов в workflow. PostgreSQL для интеграционных тестов — как в локальных тестах (если тесты бьют в БД, поднять service container; если нет — не добавлять).

Где менять:

- `.github/workflows/ci.yml`
- `README.md` (бейдж/команда не обязательны, ссылка на CI — да)

Критерии готовности:

- Workflow существует и запускает те же команды, что README.
- Нет реальных credentials в YAML.

Результат:
- Workflow `.github/workflows/ci.yml`: Node 20, `npm ci`, `npm run typecheck`, `npm run test` на PR и push в `main`/`master`.
- PostgreSQL service не добавлен: текущие тесты на in-memory mocks.
- README ссылается на CI.

Изменено:
- `.github/workflows/ci.yml`
- `README.md`

Контекст для следующих задач:
- `npm run typecheck` (`tsc --noEmit`) сейчас имеет предсуществующие ошибки в `src/routes/campaigns.ts`, `src/server/app.ts` и тестах. CI typecheck будет красным, пока их не починить отдельной задачей.

### T-190: Поля идентификации должника

Статус: `done`

Что сделать:

- В `DebtorRecord` добавить минимальные слоты для identity gate: `displayName` (как в файле клиента) и `agreementRef` (номер/хвост договора), оба опциональны на Lab.
- CSV contract расширить; без них sandbox жив, live/SM (`T-155`) сможет сверять реплику без `debtAmount`.
- Не добавлять дату рождения, паспорт, voiceprint.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/domain/debtor-record/index.ts`
- `docs/data-contracts/debtor-import-csv.md`
- `src/import/*`
- `tests/import/debtor-import-parser.test.ts`

Критерии готовности:

- Импорт без новых колонок не ломается.
- С колонками значения сохраняются tenant-scoped.
- `npm run test -- tests/import` проходит.

Результат:
- `DebtorRecord.displayName` и `agreementRef` nullable.
- CSV без колонок импортируется с `null`; с колонками значения trim, пустые → `null`.
- Дата рождения / паспорт / voiceprint не добавлялись.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0015_add_debtor_identity_fields/migration.sql`
- `src/domain/debtor-record/index.ts`
- `src/routes/campaigns.ts`
- `docs/data-contracts/debtor-import-csv.md`
- `docs/domain-model.md`
- `docs/integrations/external-systems.md`
- `tests/import/*`

Контекст для следующих задач:
- Identity gate (`T-155`) может читать `displayName`/`agreementRef`; sandbox их не требует.
- Парсер по-прежнему generic: новые опциональные колонки не нужно добавлять в `mandatoryDebtorImportFields`.

### T-191: Не писать сырой телефон в логи приложения

Статус: `done`

Что сделать:

- Хелпер маскировки (`+7 •••-••-12-34` или last4).
- Audit/error logs sandbox-звонка и импорта не содержат полный `phone`, если он туда попадает.
- В БД `DebtorRecord.phone` остаётся полным — это не лог.

Где менять:

- `src/logging/mask.ts`
- места логирования в `src/routes/calls.ts` / `src/import/*` если есть console/logger payload
- `tests/logging/mask.test.ts`

Критерии готовности:

- Unit на маскировку.
- Регрессия: ответ API с телефоном для ролей, которым он нужен, не ломается (маскировка только логов).
- `npm run test -- tests/logging/mask.test.ts` проходит.

Результат:
- `maskPhone` / `maskSensitiveFields` маскируют ключи `phone`/`phoneNumber` в audit metadata.
- Импорт не пишет телефон в логи (logger отсутствует).
- Sandbox `startCall` по-прежнему получает полный номер; в БД phone полный.

Изменено:
- `src/logging/mask.ts`
- `src/routes/calls.ts`
- `tests/logging/mask.test.ts`
- `tests/calls/sandbox-call.api.test.ts`

Контекст для следующих задач:
- Structured logger (`T-204`) должен пропускать payload через `maskSensitiveFields`.
- Не маскировать телефон в API-ответах оператора и в `DebtorRecord.phone`.

## P1. Pilot building blocks, которых не было в очереди

### T-192: Контракт object storage + fake

Статус: `done`

Что сделать:

- Интерфейс put/get recording и transcript (bytes + contentType → url).
- Fake: `sandbox://` как сейчас в CallResult, без сети.
- Не выбирать Lockbox/S3 вендора в этой задаче.

Где менять:

- `src/storage/object-store.ts`
- `src/storage/fake-object-store.ts`
- `tests/storage/object-store.test.ts`
- `docs/integrations/object-storage.md`

Критерии готовности:

- Fake детерминирован, tenant prefix в ключе.
- Нет AWS SDK в зависимостях.
- `npm run test -- tests/storage/object-store.test.ts` проходит.

Результат:
- Порт `put`/`get` для recording и transcript; fake URL `sandbox://{kind}/{tenantId}/{hint}`.
- AWS SDK в зависимостях нет.

Изменено:
- `src/storage/object-store.ts`
- `src/storage/fake-object-store.ts`
- `tests/storage/object-store.test.ts`
- `docs/integrations/object-storage.md`

Контекст для следующих задач:
- Live-провайдер позже подменяет fake тем же портом. Не выбирать S3/Lockbox здесь.

### T-193: Live без recording URL → recording_failed

Статус: `done`

Что сделать:

- Для non-fake answered звонка отсутствие `recordingUrl` или `transcriptUrl` после терминального статуса вызывает автопаузу `recording_failed` (R-RECORDING).
- Sandbox fake по-прежнему может жить на `sandbox://` URL.
- Пока live-маршрута нет — guard + unit, вызываемый из того же места, что `T-177`.

Где менять:

- `src/calls/evidence-guard.ts`
- `src/domain/campaign-auto-pause/index.ts`
- `tests/calls/evidence-guard.test.ts`

Критерии готовности:

- Нет evidence на live-пути → кампания не продолжает набор.
- Fake sandbox не автопаузится.
- `npm run test -- tests/calls/evidence-guard.test.ts tests/campaign-auto-pause.test.ts` проходит.

Результат:
- Guard: answered live без `recordingUrl`+`transcriptUrl` → автопауза `recording_failed`.
- Sandbox/fake не паузятся. `evaluateLiveCallGuards` рядом с `LIVE_CALLS_ENABLED` (как T-177); sandbox-маршрут не вызывает.

Изменено:
- `src/calls/evidence-guard.ts`
- `src/routes/calls.ts`
- `tests/calls/evidence-guard.test.ts`
- `tests/campaign-auto-pause.test.ts`

Контекст для следующих задач:
- Live-маршрут ещё нет. Не считать sandboxPass live-маркировкой.

### T-194: Скелет GigaChat без сети

Статус: `done`

Что сделать:

- `src/dialogue/llm/gigachat.ts` реализует LLM adapter: без ключа — контролируемая ошибка, без HTTP.
- Env placeholder `GIGACHAT_API_KEY` (уже в `T-165`, не дублировать секрет).

Где менять:

- `src/dialogue/llm/gigachat.ts`
- `tests/dialogue/gigachat-skeleton.test.ts`

Критерии готовности:

- Нет иностранных SDK.
- `npm run test -- tests/dialogue/gigachat-skeleton.test.ts` проходит.

Результат:
- `GigaChatAdapter` без HTTP и без иностранных SDK; ошибка `GigaChatNotConfiguredError`.
- Factory LLM умеет `gigachat`.

Изменено:
- `src/dialogue/llm/gigachat.ts`
- `src/dialogue/llm/factory.ts`
- `tests/dialogue/gigachat-skeleton.test.ts`

Контекст для следующих задач:
- HTTP GigaChat нет. Env ключ — `GIGACHAT_API_KEY`.

### T-195: Скелет адаптера Mango без сети

Статус: `done`

Что сделать:

- `src/telephony/mango/` реализует `VoiceProviderAdapter` по образцу Exolve skeleton (`T-145`).
- `mapVendorStatus`, not configured без HTTP.

Где менять:

- `src/telephony/mango/*`
- `tests/telephony/mango-adapter.test.ts`
- `.env.example` пустые `MANGO_*`

Критерии готовности:

- Resolver сможет выбрать `mango` после `T-144`.
- Секретов в git нет.
- `npm run test -- tests/telephony/mango-adapter.test.ts` проходит.

Результат:
- `MangoVoiceProvider` без HTTP; `mapVendorStatus`; `MangoNotConfiguredError`.
- Default resolver в `app.ts` регистрирует `mango` рядом с `sandbox`.
- Пустые `MANGO_API_KEY` / `MANGO_API_SALT`.

Изменено:
- `src/telephony/mango/index.ts`
- `src/server/app.ts`
- `tests/telephony/mango-adapter.test.ts`
- `.env.example`

Контекст для следующих задач:
- HTTP Mango нет. Не добавлять `exolve` в resolver до T-149.

### T-196: Handoff destination на tenant

Статус: `done`

Что сделать:

- Поля tenant или telephony connection: номер/SIP очереди и часы (не шире call-window).
- Readiness production: нет destination → `HANDOFF_UNAVAILABLE_BLOCK`.
- Live transfer в этой задаче не вызывается.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/domain/handoff-destination/index.ts`
- readiness в `src/routes/campaigns.ts`
- `docs/campaign-readiness-api.md`
- тесты readiness

Критерии готовности:

- Sandbox без очереди остаётся допустимым.
- Production-ready без очереди — blocked.
- Тесты readiness проходят.

Результат:
- Поля `handoffNumber` / окно на `TelephonyConnection`.
- Production без номера → `HANDOFF_UNAVAILABLE_BLOCK`. Sandbox-канал skip.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/db/migrations/0023_pilot_handoff_identity_webhook/migration.sql`
- `src/domain/handoff-destination/index.ts`
- `src/campaigns/readiness.ts`
- `docs/campaign-readiness-api.md`
- `tests/campaigns.create.test.ts`

Контекст для следующих задач:
- Production-ready фикстуры должны нести `handoffNumber`. Live transfer не вызывается.

### T-197: Golden / red-team фикстуры диалога

Статус: `done`

Что сделать:

- Каталог YAML/JSON кейсов: третье лицо, просьба оператора, спор, prompt injection, низкая уверенность.
- Тесты state machine (`T-155`) или отдельный runner читают фикстуры.
- Если SM ещё нет — фикстуры + skipped/failing harness, не выдумывать runtime.

Где менять:

- `tests/dialogue/golden/*.json`
- `tests/dialogue/golden-set.test.ts`
- `docs/dialogue/golden-set.md`

Критерии готовности:

- Минимум 5 кейсов с expected outcome/handoff.
- Нет ПДн реальных должников.
- Команда теста документирована.

Результат:
- 5 синтетических JSON-кейсов; SM `handoff_requested` → `handoff`.
- Команда: `npm run test -- tests/dialogue/golden-set.test.ts`.

Изменено:
- `tests/dialogue/golden/*.json`
- `tests/dialogue/golden-set.test.ts`
- `docs/dialogue/golden-set.md`

Контекст для следующих задач:
- Классификатора userText в SM нет; fail-closed через `handoff_requested`.

### T-198: Extractor CallResult из tool-call

Статус: `done`

Что сделать:

- Чистая функция: allowlisted tool payload → поля `CallResult` (`outcome`, `ptpAmount`, `ptpDate`, `reason`).
- `confirm_ptp` без `identityVerified` отвергается.
- Без LLM.

Где менять:

- `src/dialogue/extractor.ts`
- `tests/dialogue/extractor.test.ts`

Критерии готовности:

- Невалидный JSON не пишет сумму.
- `npm run test -- tests/dialogue/extractor.test.ts` проходит.

Результат:
- Allowlisted tools → `CallResult` поля. `confirm_ptp` без `identityVerified` → `IdentityGateError`. Невалидная сумма не пишется.

Изменено:
- `src/dialogue/extractor.ts`
- `tests/dialogue/extractor.test.ts`

Контекст для следующих задач:
- Без LLM. Extractor не ставит `identityVerified`.

### T-199: XLSX parser импорта

Статус: `done`

Что сделать:

- Принять `.xlsx` тем же data contract, что CSV.
- Не выполнять формулы. Пустой лист → понятная ошибка валидации.
- Лимит размера как у CSV.

Где менять:

- `src/import/debtor-import-parser.ts`
- `src/routes/campaigns.ts` (если import route там)
- `tests/import/debtor-import-parser.test.ts`
- `docs/data-contracts/debtor-import-csv.md`

Критерии готовности:

- Фикстура xlsx парсится в те же поля, что CSV.
- CSV регрессия зелёная.
- `npm run test -- tests/import` проходит.

Результат:
- ZIP+OOXML парсер без вычисления формул; пустой лист `EMPTY_XLSX`; лимит 100 МБ.
- Import API: `csvContent` или `xlsxBase64`.

Изменено:
- `src/import/xlsx-parser.ts`
- `src/routes/campaigns.ts`
- `tests/import/xlsx-fixture.ts`
- `tests/import/debtor-import-parser.test.ts`
- `docs/data-contracts/debtor-import-csv.md`

Контекст для следующих задач:
- Формулы не считать. Не добавлять exceljs/xlsx SDK без нужды.

### T-200: Pilot cap на кампании

Статус: `done`

Что сделать:

- Поле `Campaign.dailyCallCap` (int, nullable).
- Live/non-fake старт сверх cap → block `PILOT_CAP_REACHED`.
- Sandbox fake cap не считает, либо считает отдельно — явно выбрать fake не считает.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/domain/campaign/index.ts`
- `src/routes/calls.ts`
- `tests/calls/sandbox-call.api.test.ts` или unit cap

Критерии готовности:

- Без cap sandbox не ломается.
- С cap non-fake путь блокируется (unit, если live нет).
- Тест проходит.

Результат:
- `Campaign.dailyCallCap` nullable. Sandbox/fake cap не считают. Live `startedToday >= cap` → block.

Изменено:
- `src/domain/campaign/pilot-cap.ts`
- `src/domain/campaign/index.ts`
- `src/routes/calls.ts` (`evaluateLiveCallGuards`)
- `src/db/migrations/0023_pilot_handoff_identity_webhook/migration.sql`
- `tests/domain-pilot-cap.test.ts`

Контекст для следующих задач:
- Fake не считает cap. Live-маршрут ещё нет.

### T-201: identityVerified на CallAttempt

Статус: `done`

Что сделать:

- Поле `identityVerifiedAt` / boolean на попытке.
- По умолчанию false. Ставит только state machine / QA, не LLM напрямую.
- Карточка звонка отдаёт флаг.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/domain/call-attempt/index.ts`
- `src/routes/calls.ts`
- `docs/calls-api.md`
- `tests/calls/sandbox-call.api.test.ts`

Критерии готовности:

- Sandbox оставляет false, пока нет SM.
- `npm run test -- tests/calls/sandbox-call.api.test.ts` проходит.

Результат:
- Поля на `CallAttempt`, default false. Sandbox пишет false. GET карточки отдаёт флаг. LLM не ставит флаг.

Изменено:
- `src/db/prisma/schema.prisma`
- `src/domain/call-attempt/index.ts`
- `src/routes/calls.ts`
- `docs/calls-api.md`
- `tests/calls/sandbox-call.api.test.ts`

Контекст для следующих задач:
- UX карточки может рисовать identity-статус. Не ставить true из LLM.

### T-202: Webhook inbox идемпотентности

Статус: `done`

Что сделать:

- Таблица `(tenantId, sourceSystem, eventId)` unique.
- Повтор события не создаёт второй UsageEvent/CallAttempt update.
- Без реального Exolve HTTP.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/db/migrations/*`
- `src/integrations/webhook-inbox.ts`
- `tests/integrations/webhook-inbox.test.ts`

Критерии готовности:

- Дубль eventId — no-op с тем же результатом.
- Cross-tenant тот же eventId изолирован.
- `npm run test -- tests/integrations/webhook-inbox.test.ts` проходит.

Результат:
- Unique `(tenantId, sourceSystem, eventId)`. In-memory inbox: повтор — no-op без второго apply.

Изменено:
- `src/db/prisma/schema.prisma` (`WebhookInboxEvent`)
- `src/db/migrations/0023_pilot_handoff_identity_webhook/migration.sql`
- `src/integrations/webhook-inbox.ts`
- `tests/integrations/webhook-inbox.test.ts`

Контекст для следующих задач:
- Без реального Exolve HTTP. Prisma store для runtime можно добавить при HTTP webhook.

### T-203: Retention job stub

Статус: `blocked`

Что сделать:

- Не удалять evidence автоматически.
- Документ политики: пилот не purge-ит; job появится после legal memo (R-RETENTION).
- Код job не включать в prod scheduler.

Где менять:

- `docs/operations/retention.md`

Критерии готовности:

- Документ ссылается на rulebook R-RETENTION и конфликт 152‑ФЗ vs 1,5 года.
- Нет cron, который стирает CallResult.

Блокер: legal memo по сроку хранения.

Проверено:
- Документ `docs/operations/retention.md` написан (R-RETENTION, 152‑ФЗ vs 1,5 года).
- Cron/BullMQ purge не включался.

Для разблокировки: legal memo со сроком хранения. Другие задачи не зависят.

### T-204: Structured logger без PII-полей по умолчанию

Статус: `done`

Что сделать:

- Обёртка лога с `requestId`, `tenantId`, `campaignId`, без phone/debtAmount по умолчанию.
- Подключить в Fastify logger config.
- Не тащить ELK/Grafana в этой задаче.

Где менять:

- `src/logging/logger.ts`
- `src/server/app.ts`
- `tests/logging/logger.test.ts`

Критерии готовности:

- Сериализация unknown error не вываливает `DebtorRecord` целиком.
- `npm run test -- tests/logging/logger.test.ts` проходит.

Результат:
- `createSafeLogRecord` / `serializeUnknownError` без phone/debtAmount. Fastify `err` serializer; в `test` logger выключен.

Изменено:
- `src/logging/logger.ts`
- `src/server/app.ts`
- `tests/logging/logger.test.ts`

Контекст для следующих задач:
- Не логировать DebtorRecord целиком. Payload через `maskSensitiveFields`.

## P1. UX-волна кабинета (аудит 17.08.2026)

Источник: `docs/product/2026-08-17-ux-audit-cabinet.md`. Improve existing `prototype.html`, не новый кабинет и не параллельный план. Не дублировать закрытые UX `T-065`–`T-072`, `T-127`, `T-128`. Identity-статус в карточке звонка не рисовать до `T-201`. Live без legal memo не обещать.

Порядок волны: `T-205` → `T-228`. Lab `T-129+` не сдвигать.

### T-205: Колонка риска и CTA «Открыть причину» на Главной

Статус: `done`

Что сделать:

- В таблице «Последние кампании» на `#home` колонка риска/причины сразу справа от статуса.
- У строки с `автопауза` главный CTA — «Открыть причину» (`data-open-campaign="launch"`), не «Перенастроить» в настройки.
- Числа «3 084» / «1 172» не показывать как факт: либо не выводить, либо явная метка «демо».

Где менять:

- `prototype.html`
- `tests/prototype-home-risk.test.ts`
- `PRODUCT_LANGUAGE.md` (если фиксируется термин «Открыть причину»)

Критерии готовности:

- В HTML `#home` у автопаузы нет кнопки «Перенастроить»; есть «Открыть причину».
- В таблице главной нет голых KPI без метки «демо», либо колонок диалогов/обещаний нет.
- `npm run test -- tests/prototype-home-risk.test.ts` проходит.

### T-206: Колонка риска и CTA «Открыть причину» в списке кампаний

Статус: `done`

Что сделать:

- На `#campaigns` колонка риска/причины рядом со статусом; фильтр статусов включает «Автопауза», не только «Работает / Черновик».
- У кампании в автопаузе главный CTA — «Открыть причину» → вкладка «Запуск».
- Метрики над таблицей (2 работают / 1 очередь операторов / 12 завершены) не выдавать за живые, если нет API: метка «демо» или убрать.

Где менять:

- `prototype.html`
- `tests/prototype-campaigns-list.test.ts`

Критерии готовности:

- В `#campaigns` у автопаузы CTA ведёт на `launch`, не на `settings`.
- В селекте статусов есть автопауза.
- `npm run test -- tests/prototype-campaigns-list.test.ts` проходит.

### T-207: Шапка автопаузы ведёт на «Запуск», не в настройки

Статус: `done`

Что сделать:

- В `.campaign-top` при статусе `auto_paused` главный CTA — «Открыть причину» / «Возобновить после проверки» → вкладка «Запуск» с баннером safe-resume.
- Кнопка «Перенастроить» (`data-camp-tab-link="settings"`) не главный CTA в автопаузе: скрыть или оставить вторичной.
- Не менять чеклист safe-resume.

Где менять:

- `prototype.html` (`setCampaignState`, `.head-actions`)
- `tests/prototype-campaign-header.test.ts`

Критерии готовности:

- При `auto_paused` в шапке нет единственной заметной кнопки «Перенастроить».
- Клик главного CTA открывает `data-camp-view="launch"`.
- `npm run test -- tests/prototype-campaign-header.test.ts` проходит.

### T-208: Глобальный экран «Очередь проверок» с таблицей и drawer

Статус: `done`

Что сделать:

- На `#reviewQueue` показать существующие фильтры, метрики, таблицу `#reviewQueueBody` и `reviewDrawer`; не собирать второй UI.
- Вкладка кампании «Проверка» остаётся той же таблицей, отфильтрованной по `campaignId`.
- Drill-down отчёта `showScreen('reviewQueue')` открывает заполненный глобальный экран, не заглушку из абзаца.

Где менять:

- `prototype.html` (`#reviewQueue`, `renderReviewQueue`, `openReviewQueue`)
- `tests/prototype-review-queue.test.ts`

Критерии готовности:

- В `#reviewQueue` есть `tbody` очереди, не только поясняющий абзац.
- `renderReviewQueue()` без campaign-scope заполняет глобальный экран.
- `npm run test -- tests/prototype-review-queue.test.ts` проходит.

### T-209: Тестовый звонок не переводит кампанию в «работает»

Статус: `done`

Что сделать:

- `#runTestCall` обновляет только `#testCallResult` (номер, итог, время). Не вызывать `setCampaignState('running')`.
- Кнопка теста не выглядит как запуск обзвона: текст про проверку соединения, не про старт кампании.
- Статус кампании после теста остаётся прежним.

Где менять:

- `prototype.html` (обработчик `#runTestCall`)
- `tests/prototype-test-call.test.ts`

Критерии готовности:

- В обработчике `#runTestCall` нет `setCampaignState('running')`.
- После теста `#campaignStatus` не обязан стать «работает».
- `npm run test -- tests/prototype-test-call.test.ts` проходит.

### T-210: Модалка запуска: название, готовность, sandbox, cap

Статус: `done`

Что сделать:

- `#launchCampaign` и `#wizardControlledLaunch` открывают подтверждение: название кампании, итог `readiness-summary`, режим sandbox (live не обещать), cap если поле уже есть в данных.
- Текст: новые звонки начнут создаваться в пределах проверки готовности; при риске — автопауза.
- Кнопка запуска `disabled`, пока readiness не `ready`. После подтверждения — переход статуса и toast без «Первые звонки появятся…» как production-факт.
- Зависимость: `T-209` уже отделила тест от запуска.

Где менять:

- `prototype.html`
- `tests/prototype-launch-confirm.test.ts`
- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- Запуск без модалки подтверждения невозможен.
- В модалке есть название и sandbox; нет формулировки полностью автономного боевого обзвона.
- `npm run test -- tests/prototype-launch-confirm.test.ts` проходит.

### T-211: Решение review не меняет статус кампании

Статус: `done`

Что сделать:

- `updateReviewDecision` меняет только статус задачи (`approved` / `rejected` / `escalated` / `requeued`). Не вызывать `setCampaignState('running'|'manual_paused'|'auto_paused')`.
- Убрать источник `manual_override` и тип `legal_review` из фильтров и демо-данных; в UI типы только `qa` / `compliance` (как `docs/review-items-api.md`).
- Кнопки: «Подтвердить разбор» / «Отклонить» / «Передать дальше» / «Оставить в очереди». Next step RQ-1001: «Проверьте событие. Возобновление — на вкладке «Запуск» после чеклиста».

Где менять:

- `prototype.html` (`updateReviewDecision`, `reviewQueueItems`, `reviewSourceMeta`, `#approveReviewItem`)
- `tests/prototype-review-queue.test.ts`
- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- В `updateReviewDecision` нет вызова `setCampaignState`.
- В видимом UI нет `manual_override` и `legal_review`.
- `npm run test -- tests/prototype-review-queue.test.ts` проходит.

### T-212: Обзор без ложных ✓ до readiness-summary

Статус: `done`

Что сделать:

- В `data-camp-view="overview"` не держать четыре зелёные `✓` в статическом HTML до ответа `readiness-summary`.
- Пока API не пришёл: «Не проверено» / пустое состояние, не «готово».
- Не показывать «Кампания в рабочем режиме. Риск-событий нет.» как дефолт обзора, если статус не `running` или есть открытый риск.

Где менять:

- `prototype.html` (overview readiness rows, `applySafeResumePanel` / runtime notice если он виден с обзора)
- `tests/prototype-overview-readiness.test.ts`

Критерии готовности:

- В исходном HTML overview нет четырёх `.ready-icon` с `✓` как факта готовности.
- До API обзор не выглядит полностью зелёным.
- `npm run test -- tests/prototype-overview-readiness.test.ts` проходит.

### T-213: Readiness: «Блокирует запуск» / «Предупреждение»; лимиты из API

Статус: `done`

Что сделать:

- На шаге 5 мастера и вкладке «Запуск» причины readiness делить на группы «Блокирует запуск» и «Предупреждение» из `reasons[].reasonText` / `nextAction`.
- Пункт «Лимиты и время» / «Применены» не хардкодить `state-ready`: брать факт из `readiness-summary`, иначе «Нужна проверка».
- Поля окна в мастере и «Настройки»: нельзя ввести интервал шире системного минимума, который уже применяет backend (`08:00–22:00` по timezone записи). Минимум read-only, не выключаемый тоггл. Юридическую норму в UI не формулировать.

Где менять:

- `prototype.html` (`syncCampaignLaunchReadinessPanel`, `updateWizardReadiness`, `#wizardWeekdays`, `#wizardWeekends`, вкладка settings)
- `tests/prototype-readiness-groups.test.ts`

Критерии готовности:

- `#campaignLaunchLimitsStatus` и `#readinessLimitsStatus` не стартуют как «Применены» в HTML.
- Блокирующие и предупреждения различимы в DOM.
- `npm run test -- tests/prototype-readiness-groups.test.ts` проходит.

### T-214: Русские message валидатора импорта

Статус: `done`

Что сделать:

- В `src/import/debtor-import-validator.ts` и `src/import/phone-normalizer.ts` поле `message` — русский текст с next step: чего не хватает и что сделать.
- Коды ошибок API оставить английскими. Не выдумывать юридические причины исключения.
- Обновить тесты, которые сейчас ждут `Missing required columns` / `Phone is empty` / `Duplicate externalId`.

Где менять:

- `src/import/debtor-import-validator.ts`
- `src/import/phone-normalizer.ts`
- `tests/import/debtor-import-validator.test.ts`
- `tests/import/phone-normalizer.test.ts`
- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- Сообщение про отсутствующие колонки перечисляет часовой пояс, сумму долга, статус долга, статус согласия по-русски.
- `npm run test -- tests/import` проходит.

### T-215: Отчёт импорта: найдено / готовы / исправить / дубли

Статус: `done`

Что сделать:

- На шаге 2 мастера после загрузки показать: найдено N, готовы, требуют исправления, дубли; список причин по строкам (из ответа импорта или текущего сима, без выдуманных KPI).
- Развести кнопки «Продолжить с принятыми записями» и «Исправить файл». «Загрузить пример» не выглядит как успешный боевой импорт без пометки примера.
- Не называть «исключено» смесь правил и ошибок одной цифрой без расшифровки.

Где менять:

- `prototype.html` (`#mappingBlock`, `baseReady`, `setWizardBaseState`)
- `tests/prototype-import-report.test.ts`

Критерии готовности:

- В шаге 2 видны четыре счётчика или эквивалент: найдено / готовы / исправить / дубли.
- Пример базы помечен как пример.
- `npm run test -- tests/prototype-import-report.test.ts` проходит.

### T-216: Маппинг импорта: часовой пояс, статус долга, статус согласия

Статус: `done`

Что сделать:

- В `#mappingBlock` и на вкладке «База» показать поля контракта импорта: номер клиента, телефон, часовой пояс, сумма долга, статус долга, статус согласия.
- Не добавлять полей, которых нет в `docs/data-contracts/debtor-import-csv.md`.
- Подпись «допущено» в маппинге не использовать для ещё не проверенных к звонку строк.

Где менять:

- `prototype.html`
- `docs/data-contracts/debtor-import-csv.md` (сверка списка, без смены контракта)
- `tests/prototype-import-mapping.test.ts`

Критерии готовности:

- В маппинге есть часовой пояс, статус долга и статус согласия.
- Нет обещания eligibility-проверки на этом шаге.
- `npm run test -- tests/prototype-import-mapping.test.ts` проходит.

### T-217: Вкладка «База»: «принято в базу» ≠ «допущено к звонку»

Статус: `done`

Что сделать:

- На `data-camp-view="base"` метрику «Допущено» переименовать в «Принято в базу»; отдельно пояснить, что допуск к звонку — на проверке перед звонком, не на импорте.
- «Исключено» не смешивать правила и ошибки одной подписью: две строки или расшифровка.
- Ссылку «скачать проблемные строки» не рисовать, если нет API выгрузки; показать список причин, который уже есть.

Где менять:

- `prototype.html` (`data-camp-view="base"`)
- `PRODUCT_LANGUAGE.md`
- `tests/prototype-base-metrics.test.ts`

Критерии готовности:

- На вкладке «База» нет метрики «Допущено», читаемой как eligibility.
- Нет кнопки скачивания, если endpoint выгрузки отсутствует.
- `npm run test -- tests/prototype-base-metrics.test.ts` проходит.

### T-218: «Далее» на шаге 1 мастера не пропускает error

Статус: `done`

Что сделать:

- `#wizardNext` на шаге 1 `disabled`, пока `wizardStepStates.campaign.status` = `empty` / `loading` / `error`.
- Если шаг 1 дергает create/update кампании — показать `message` ответа; без успешного сохранения не переходить к шагу 2.
- Не обещать полей, которых нет в campaigns API.

Где менять:

- `prototype.html` (`#wizardNext`, `evaluateCampaignStepState`)
- `tests/prototype-wizard-step1.test.ts`

Критерии готовности:

- Клик «Далее» при error/empty не меняет `wizardStep` на 2.
- `npm run test -- tests/prototype-wizard-step1.test.ts` проходит.

### T-219: Журнал звонков: исход API, решение, QA; `handoff` вместо `transferred`

Статус: `done`

Что сделать:

- Колонки журнала: статус попытки, исход из enum API, решение allow/block + человекочитаемая причина + время, QA.
- Фильтр `transferred` / «Передача оператору» заменить на `handoff` / «Перевод оператору».
- Колонку «Источник исхода» переименовать в «Как получен результат» или убрать с первого уровня.
- Бейдж `live` / `демо` на строке, не только над таблицей. Поле identity не выдумывать (ждёт `T-201`).

Где менять:

- `prototype.html` (`#callsTableBody`, `#callOutcomeFilter`, `callOutcomeMeta`)
- `tests/prototype-calls-journal.test.ts`
- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- В прототипе нет пользовательского фильтра `transferred`.
- В таблице есть решение allow/block или явный прочерк, не скрытый код `TIME_WINDOW_VIOLATION` без текста.
- `npm run test -- tests/prototype-calls-journal.test.ts` проходит.

### T-220: Карточка звонка: disclosure, запись «хранится/нет», свёрнутый timeline

Статус: `done`

Что сделать:

- В демо-транскрипте убрать «я представитель банка»; первая реплика — автоматизированный интеллектуальный агент от имени организации, как в сценарии кампании.
- Ссылку «Скачать запись» при `sandbox://…` заменить на статус «Запись хранится» / «Записи нет»; плеер не добавлять.
- Техтаймлайн (`stage`, `usage-event`) свернуть; сверху — статус попытки, исход, решение, QA.
- `callAttemptId` не в заголовке первым уровнем.

Где менять:

- `prototype.html` (`#callCardDrawer`, демо `call-883090`)
- `tests/prototype-call-card.test.ts`

Критерии готовности:

- В `prototype.html` нет строки «я представитель банка».
- Нет `href` на `sandbox://` как «Скачать запись».
- `npm run test -- tests/prototype-call-card.test.ts` проходит.

### T-221: Источники: обмен и папка «не в этом релизе»

Статус: `done`

Что сделать:

- На `#sources` карточка «Загрузка файла» остаётся рабочим путём.
- «Система взыскания» и «Защищённая папка»: статус не «подключена»; подпись «не в этом релизе»; кнопки «Настроить обмен» / «Подключить» не обещают v1-интеграцию.
- Не добавлять новый UI обмена.

Где менять:

- `prototype.html` (`#sources`)
- `PRODUCT_LANGUAGE.md`
- `tests/prototype-sources.test.ts`

Критерии готовности:

- В `#sources` нет тега «подключена» у системы взыскания.
- Есть явная пометка «не в этом релизе» у обмена и папки.
- `npm run test -- tests/prototype-sources.test.ts` проходит.

### T-222: «Прослушать» → «Тестовый диалог»

Статус: `done`

Что сделать:

- На `#scripts` кнопку `data-test-dialog` подписать «Тестовый диалог», не «Прослушать».
- Клик открывает уже существующий `#dialogDrawer`, не обещает аудио.
- Вкладку сценария кампании не ломать: там уже «Тестовый диалог».

Где менять:

- `prototype.html` (`#scripts`)
- `tests/prototype-scripts.test.ts`

Критерии готовности:

- В `#scripts` нет кнопки «Прослушать».
- Есть «Тестовый диалог» с `data-test-dialog`.
- `npm run test -- tests/prototype-scripts.test.ts` проходит.

### T-223: Пункты «Интеграции» и «Сценарии» в сайдбаре

Статус: `done`

Что сделать:

- Показать уже существующие `#telephony` и `#scripts` в глобальной навигации. Допустимо: пункт «Интеграции» (внутри источники + телефония) и отдельный «Сценарии», как в `prd-open-questions.md`.
- Вкладки кампании «Телефония» / «Сценарий» оставить выбором соединения и версии, не дублировать админ-формы.
- Это возврат входа, который `T-127` скрыл; IA не пересобирать с нуля.

Где менять:

- `prototype.html` (sidebar `data-screen`, `screenNames`)
- `tests/prototype-nav.test.ts`

Критерии готовности:

- Из сайдбара открываются `#telephony` и `#scripts` (напрямую или через «Интеграции»).
- Экраны `#telephony` / `#scripts` не удалены.
- `npm run test -- tests/prototype-nav.test.ts` проходит.

### T-224: Подтверждение «Приостановить кампанию»

Статус: `done`

Что сделать:

- `#pauseCampaign` не ставит паузу одним кликом: модалка «Приостановить «…»? Новые звонки не создаются.» Кнопки: «Приостановить кампанию» / «Отмена».
- Подпись кнопки в шапке — «Приостановить кампанию», не «Пауза».
- Для ручной паузы оставить отличие от автопаузы в UI (`Снять паузу` → «Продолжить обзвон»). Не вызывать API-статус, которого нет: локальный paused-контур прототипа, не `stopped`.

Где менять:

- `prototype.html` (`#pauseCampaign`, `#resumeCampaign`)
- `tests/prototype-pause-confirm.test.ts`
- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- Один клик по `#pauseCampaign` не меняет статус без подтверждения.
- В шапке нет голой кнопки «Пауза».
- `npm run test -- tests/prototype-pause-confirm.test.ts` проходит.

### T-225: Подтверждение остановки как переход в `completed`

Статус: `done`

Что сделать:

- `#stopCampaign` открывает модалку: «Остановить «…»? Для продолжения нужен новый запуск.» Кнопка называет действие.
- В UI «остановлена» отображает API-статус `completed` (в enum нет `stopped`). Не вводить локальный `stopped` как отдельную машину.
- Если продукт решит, что stop ≠ `completed`, задачу не закрывать костылём — вернуть в `blocked` и завести backend 1 SP. Пока confirm: см. журнал волны.

Где менять:

- `prototype.html` (`#stopCampaign`, `setCampaignState`)
- `tests/prototype-stop-confirm.test.ts`

Критерии готовности:

- Нет одношагового stop через toast.
- После подтверждения статус в шапке — пользовательский ярлык для `completed`, не выдуманный `stopped` в копирайте как отдельный API-enum.
- `npm run test -- tests/prototype-stop-confirm.test.ts` проходит.

### T-226: Селект роли в отчёте — демонстрация прав, не смена должности

Статус: `done`

Что сделать:

- `#reportRoleSelector` либо убрать, либо оставить с явной подписью «демонстрация прав» / «что видит роль» и не называть «Роль для принятия решений».
- Подпись `Compliance officer` → «Специалист по ограничениям».
- Не имитировать смену доступа в API.

Где менять:

- `prototype.html` (`#reportRoleSelector`, `#reportRoleHint`)
- `PRODUCT_LANGUAGE.md`
- `tests/prototype-report-role.test.ts`

Критерии готовности:

- В отчёте нет селекта, который читается как смена должности без пометки демонстрации.
- Нет пользовательской строки «Compliance officer».
- `npm run test -- tests/prototype-report-role.test.ts` проходит.

### T-227: Воронка отчёта: «Завершено» не сверлит `outcome=all`

Статус: `done`

Что сделать:

- Кнопка «Завершено» в `#reportFunnel` не ставит `data-report-outcome="all"`.
- Drill ведёт к журналу с понятным знаменателем (завершённые попытки / соединения), не «все исходы».
- Не выдумывать outcome вне enum `CallResultOutcome`.

Где менять:

- `prototype.html` (`#reportFunnel`, `#reportOutcomeCompletedCount`)
- `tests/prototype-report-funnel.test.ts`

Критерии готовности:

- У KPI «Завершено» нет `data-report-outcome="all"`.
- Подпись знает, что считается в знаменателе.
- `npm run test -- tests/prototype-report-funnel.test.ts` проходит.

### T-228: Журнал кампании без внутренних `campaign state` / `safe-resume`

Статус: `done`

Что сделать:

- `addCampaignActivity` пишет пользовательские фразы: «Кампания приостановлена системой», без `campaign state: …` и без `safe-resume` в видимом тексте.
- Идентификаторы событий — вторым уровнем, если нужны.
- Не менять состав audit API.

Где менять:

- `prototype.html` (`addCampaignActivity`, `setCampaignState`)
- `PRODUCT_LANGUAGE.md`
- `tests/prototype-activity-copy.test.ts`

Критерии готовности:

- В скрипте нет пользовательской строки `campaign state:`.
- В ленте `#campaignActivityLog` нет `safe-resume` как термина оператора.
- `npm run test -- tests/prototype-activity-copy.test.ts` проходит.

Результат волны `T-205`–`T-228`:
- Кабинет `prototype.html`: риск и CTA «Открыть причину» на главной и в списке; шапка автопаузы ведёт на «Запуск»; глобальная очередь проверок с таблицей; тест соединения не ставит `running`; запуск/пауза/остановка через модалку; review не меняет статус кампании; overview без ложных ✓; группы «Блокирует запуск» / «Предупреждение»; русские `message` импорта; отчёт импорта и маппинг контракта; «принято в базу» ≠ допуск к звонку; wizard step 1 не пропускает error; журнал `handoff`; карточка без «представитель банка» и без `sandbox://` download; источники «не в этом релизе»; «Тестовый диалог»; сайдбар Интеграции + Сценарии; stop = `completed`; роль в отчёте — демонстрация прав; воронка «Завершено» не `outcome=all`; лента без `campaign state` / `safe-resume`.
- Проверка: `npm run test -- tests/prototype tests/import`.

Изменено:
- `prototype.html`
- `PRODUCT_LANGUAGE.md`
- `src/import/debtor-import-validator.ts`
- `src/import/phone-normalizer.ts`
- `tests/prototype-*.test.ts`
- `tests/import/debtor-import-validator.test.ts`

Контекст:
- Live без legal memo не обещать. Identity в карточке: «не подтверждена» по умолчанию. Stop в UI отображает `completed`.

### T-229: Клиентский кабинет — канонический путь и IA

Статус: `done`

Что сделать:

- Пересобрать `prototype.html` по утверждённой спеке кабинета клиента: меню Главная / Источники / Телефония / Аналитика / Журнал действий; вкладки кампании Обзор · База · Сценарий · Телефония · Звонки.
- Главная = список кампаний без «Действия» и «Открыть причину». Запуск только в шапке Обзора, fail-closed.
- Убрать клиентские экраны админ-контура, вкладки Запуск/Проверка/Отчёт/Настройки, шаг мастера «Проверка перед запуском».
- Словарь и антипаттерны той же волны. Не расширять enum кампании, не делать живую CRM.

Где менять:

- `prototype.html`
- `tests/prototype-*.test.ts`
- `PRODUCT_LANGUAGE.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Меню и вкладки совпадают со спекой §4.1–4.2.
- Путь создать → база → сценарий → телефония → запуск с Обзора проходит без третьей кнопки.
- `npm run test -- tests/prototype-*.test.ts` проходит. Инлайн-скрипт парсится (`new Function`).

## P1. Tech hygiene (волна 11)

### T-230: Починить npm run typecheck

Статус: `done`

Что сделать:

- Исправить ошибки `tsc --noEmit` в `src/` и `tests/` (~147 на 19.08.2026).
- Не менять runtime-поведение без необходимости; приоритет — типы моков в тестах и deps в `app.ts`/`campaigns.ts`.

Где менять:

- `src/routes/campaigns.ts`
- `src/server/app.ts`
- `tests/campaigns.create.test.ts`
- `tests/reports/campaign-report.api.test.ts`
- прочие файлы из вывода `npm run typecheck`

Критерии готовности:

- `npm run typecheck` exit 0.
- `npm run test` по-прежнему зелёный.
- CI job `check` проходит typecheck.

### T-231: Синхронизировать as-is документацию

Статус: `done`

Что сделать:

- Обновить `ROADMAP_B2B_SAAS.md` §8 под T-229 и текущий код.
- Обновить `docs/architecture/2026-08-17-technology-map.md` §2 (as-is).
- Обновить `docs/product/prd-open-questions.md` §6–7 (разрывы и IA клиентского кабинета CJ).
- Сверить с шапкой «Архитектура as-is» в этом файле.

Где менять:

- `ROADMAP_B2B_SAAS.md`
- `docs/architecture/2026-08-17-technology-map.md`
- `docs/product/prd-open-questions.md`
- `TECH_BACKLOG_1SP.md` (журнал)

Критерии готовности:

- Нет утверждений «нет frequency ledger / docker / BYOK» там, где код уже есть.
- IA клиента соответствует `docs/superpowers/specs/2026-08-18-client-cabinet-cj-design.md`.

## P1. API-backed клиентский кабинет (волна 12)

Источник: CJ-спека; backend API уже есть, UI после `T-229` ещё demo/local на ключевых шагах.

### T-232: Главная — список кампаний из API

Статус: `done`

Что сделать:

- Загружать строки Главной из `GET /tenants/:tenantId/campaigns` вместо статичных `<tr>`.
- Показывать empty/error/fallback без падения навигации.
- Сохранить колонки CJ-спеки: чекбокс, название (клик), статус, прогресс «Обзвонили».

Где менять:

- `prototype.html`
- `tests/prototype-campaigns-list.test.ts`
- `tests/prototype-home-risk.test.ts`

Критерии готовности:

- При доступном API список строится из ответа сервера.
- Нет колонки «Действия» и «Открыть причину».
- `npm run test -- tests/prototype-campaigns-list.test.ts tests/prototype-home-risk.test.ts` проходит.

### T-233: Мастер — создание кампании через POST /campaigns

Статус: `done`

Что сделать:

- Шаг 1 мастера вызывает `POST /campaigns` с `X-Tenant-Id` / `X-User-Role`.
- Ошибки API показываются inline на шаге, без false success.
- После успеха — переход к вкладкам кампании с реальным `campaignId`.

Где менять:

- `prototype.html`
- `tests/prototype-nav.test.ts` (парсинг скрипта)
- новый или существующий `tests/prototype-wizard-create.test.ts`

Критерии готовности:

- Локальный «успех» без ответа API невозможен на шаге создания.
- `campaignId` из ответа используется в последующих fetch.

### T-234: Вкладка «База» — импорт через API

Статус: `done`

Что сделать:

- Загрузка файла вызывает `POST .../debtors/import` (CSV или XLSX base64 по контракту API).
- Показать `acceptedCount`, `rejectedCount`, ошибки по строкам на человеческом русском.
- Различать «принято в базу» и «допущено к звонку» в copy (`PRODUCT_LANGUAGE.md`).

Где менять:

- `prototype.html`
- `tests/prototype-import-mapping.test.ts`
- `tests/prototype-import-report.test.ts`

Критерии готовности:

- Нет hardcoded 10 000/8 740/1 260 после успешного API-импорта.
- Ошибки валидации из API видны на вкладке «База».

### T-235: Запуск, пауза, стоп через PATCH status

Статус: `done`

Что сделать:

- Подтверждённый запуск/остановка/возобновление (где API позволяет) через `PATCH .../campaigns/:id/status`.
- Ручная пауза может остаться локальной меткой UI, если enum не поддерживает — не выдумывать API `stopped`.
- Передавать `X-User-Role: owner` или `collection_manager` для write.

Где менять:

- `prototype.html`
- `tests/prototype-launch-confirm.test.ts`
- `tests/prototype-pause-confirm.test.ts`
- `tests/prototype-stop-confirm.test.ts`

Критерии готовности:

- Запуск после confirm вызывает backend transition, не только `setCampaignState('running')`.
- Fail-closed: при 409/403 кнопка не показывает ложный успех.

### T-236: Аналитика из report API

Статус: `done`

Что сделать:

- Экран «Аналитика» и KPI Обзора агрегируют данные из `GET .../report` (per campaign + фильтр «все»).
- Убрать или скрыть demo-notice, когда все метрики из live API.
- Сохранить четыре показателя: Обзвонено, Соединилось, Обещания, Стоимость.

Где менять:

- `prototype.html`
- `tests/prototype-report-funnel.test.ts`
- `PRODUCT_LANGUAGE.md`

Критерии готовности:

- `renderAnalytics()` не использует только hardcoded `byCampaign` при успешном API.
- Подпись «демо» только при fallback.

### T-237: Тестовый звонок через sandbox API

Статус: `done`

Что сделать:

- Кнопка проверки соединения вызывает `POST .../calls/sandbox` для выбранного debtor (или documented test debtor).
- Убрать `setTimeout`-mock как единственный путь успеха.
- Явно: кампания не переходит в `running`.

Где менять:

- `prototype.html`
- `tests/prototype-test-call.test.ts`

Критерии готовности:

- Успех/ошибка sandbox отображаются из ответа API.
- `npm run test -- tests/prototype-test-call.test.ts` проходит.

### T-238: Overview KPI только из API

Статус: `done`

Что сделать:

- Метрики Обзора (`campaignOverview*`) синхронизировать с report/readiness; при отсутствии данных — «н/д», не выдуманные цифры.
- Ссылки «Аналитика» сохраняют фильтр кампании.

Где менять:

- `prototype.html`
- `tests/prototype-campaign-header.test.ts`

Критерии готовности:

- Нет статичных 6 800 / 3 102 при live API и пустой кампании.
- Readiness на Обзоре по-прежнему из `readiness-summary`.

## P1. Controlled Pilot skeleton (волна 13)

Live-трафик не включать до legal memo и разблокировки `T-149`/`T-157`.

### T-239: POST .../calls/live — skeleton маршрута

Статус: `done`

Что сделать:

- Реализовать маршрут по контракту `docs/calls-api.md` с `isLiveCallsEnabled()`, compliance, production telephony gates, resolver adapter.
- Без HTTP Exolve: использовать sandbox или fake adapter за флагом; `LIVE_CALLS_ENABLED=false` по умолчанию.

Где менять:

- `src/routes/calls.ts`
- `src/server/app.ts`
- `tests/calls/live-call.api.test.ts` (новый)

Критерии готовности:

- При `LIVE_CALLS_ENABLED=false` → 403/503 с понятным кодом.
- При включении и sandbox connection — создаётся `CallAttempt` по тем же правилам, что sandbox POST.
- Tenant isolation и compliance fail-closed покрыты тестами.

### T-240: Wire call orchestrator к call path

Статус: `done`

Что сделать:

- Подключить `src/jobs/` / orchestrator hook к завершению sandbox (или live skeleton) без сетевых ASR/TTS.
- Fake adapters проходят state machine один turn; usage events не дублируются.

Где менять:

- `src/jobs/worker.ts`
- `src/routes/calls.ts`
- `tests/jobs/call-jobs.test.ts`

Критерии готовности:

- Один sandbox-звонок может пройти через orchestrator stub в тестах.
- `SANDBOX_CALLS_QUEUE_ENABLED` default false сохранён.

### T-241: Tenant-level analytics endpoint

Статус: `done`

Что сделать:

- `GET /tenants/:tenantId/analytics/summary` — агрегация report-метрик по кампаниям tenant (limit/period v0).
- RBAC как у report. Документ route-level.

Где менять:

- `src/routes/reports.ts` или новый `src/routes/analytics.ts`
- `docs/reports-api.md` или `docs/analytics-api.md`
- `tests/analytics/tenant-summary.api.test.ts`

Критерии готовности:

- Endpoint возвращает те же четыре KPI для UI «Аналитика».
- Tenant isolation в тестах.

### T-242: Payment outcome в домене и отчёте

Статус: `done`

Что сделать:

- Расширить `CallResult` optional полями payment outcome v0 (enum + nullable timestamp/amount).
- Включить в campaign report агрегацию «оплата после обещания» как placeholder для пилота.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/domain/call-result/index.ts`
- `src/reports/campaign-report.ts`
- `tests/reports/campaign-report.test.ts`

Критерии готовности:

- Миграция применима; report не ломает существующие поля.
- Без live payment feed — только schema + report math на событиях.

### T-243: CDR reconciliation stub

Статус: `done`

Что сделать:

- Модуль `src/telephony/cdr-reconciliation.ts`: compare provider status vs `CallAttempt` (in-memory/fake).
- Документ `docs/operations/cdr-reconciliation.md` — процесс пилота, не production cron.

Где менять:

- `src/telephony/cdr-reconciliation.ts`
- `docs/operations/cdr-reconciliation.md`
- `tests/telephony/cdr-reconciliation.test.ts`

Критерии готовности:

- Тест на mismatch → audit/event stub, без auto-delete.
- Live HTTP не требуется.

### T-244: Лендинг и web-регистрация/вход

Статус: `done`

Что сделать:

- Статические `landing.html`, `register.html`, `login.html`, `privacy.html`, `terms.html`.
- `dev-gateway`: `/` → `/landing.html`, прокси `/auth/*`.
- Backend: `POST /auth/register|login|logout`, `GET /auth/me`, `User.passwordHash` (argon2), таблица `Session`, `authContextMiddleware`.
- `prototype.html`: `/auth/me`, заголовки из currentAuth, выход.

Где менять:

- `src/routes/auth.ts`
- `src/server/middleware/auth-context.ts`
- `src/server/middleware/tenant-context.ts`
- `src/server/middleware/rbac.ts`
- `src/db/prisma/schema.prisma`
- `scripts/dev-gateway.mjs`
- `landing.html`, `register.html`, `login.html`, `privacy.html`, `terms.html`, `prototype.html`
- `tests/auth/*`, `tests/landing-auth-pages.test.ts`, `tests/prototype-auth-session.test.ts`

Критерии готовности:

- `/` открывает лендинг, CTA ведёт в регистрацию.
- После регистрации/входа — кабинет.
- Создание кампании шлёт tenant/role из сессии.
- Header-based fallback сохранён.

## P1. RBAC SaaS v1

Источник: `docs/superpowers/specs/2026-08-19-rbac-role-model-design.md`, план внедрения: `docs/superpowers/plans/2026-08-19-rbac-saas-v1.md`. Эта волна упрощает старую RBAC-модель до B2B SaaS v1: `tenant_owner`, `campaign_manager`, `tenant_viewer`, `platform_admin`, `support_engineer`.

### T-245: Синхронизировать decision doc RBAC с SaaS v1 ролями

Статус: `done`

Что сделать:

- Обновить `docs/security/rbac.md` под упрощённую модель из спеки.
- Зафиксировать канонические роли SaaS v1 и legacy alias mapping для старых значений `owner`, `collection_manager`, `operator`, `integration_admin`, `qa_analyst`, `compliance_officer`.
- Убрать из decision doc обязательность enterprise-ролей для v1 и вынести их в раздел `позже`.

Где менять:

- `docs/security/rbac.md`
- `docs/superpowers/specs/2026-08-19-rbac-role-model-design.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- В `docs/security/rbac.md` описаны только актуальные роли SaaS v1 и таблица alias-совместимости.
- Документ явно различает `tenant` и `platform` контуры.
- Из документа понятно, что `support_engineer` не получает постоянный доступ к данным клиента.

### T-246: Ввести canonical role normalization для header/auth context

Статус: `done`

Что сделать:

- Добавить слой нормализации роли, который преобразует старые значения `X-User-Role` в канонические роли SaaS v1.
- Подготовить тот же контракт для будущего auth context, чтобы route-код не зависел от сырого header значения.
- Добавить тесты на alias, неизвестную роль и отсутствие роли.

Где менять:

- `src/server/middleware/*role*`
- `src/server/app.ts`
- `tests/*rbac*`
- `tests/*api.test.ts`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- В request context попадает одна каноническая роль из набора SaaS v1.
- Старые роли через alias продолжают работать предсказуемо.
- Неизвестная роль и отсутствие роли дают прежний отказ доступа.

### T-247: Добавить единый authorizer по зонам доступа

Статус: `done`

Что сделать:

- Ввести единый authorizer для зон `campaigns`, `calls`, `reports`, `integrations`, `users`, `audit_logs`.
- Зафиксировать в коде минимальную матрицу SaaS v1: `tenant_owner`, `campaign_manager`, `tenant_viewer`, `platform_admin`, `support_engineer`.
- Сохранить backend как источник истины: route-level проверки должны вызывать authorizer, а не хранить локальные списки ролей.

Где менять:

- `src/server/authz/*` или `src/domain/authz/*`
- `src/server/middleware/*role*`
- `tests/*rbac*`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- В проекте есть один переиспользуемый authorizer вместо разрозненных списков ролей по endpoints.
- Матрица доступа в коде соответствует SaaS v1 спеке.
- Unit-тесты покрывают как минимум успешный доступ и отказ для каждой зоны доступа.

### T-248: Перевести campaign/calls/report/audit endpoints на SaaS v1 authorizer

Статус: `done`

Что сделать:

- Заменить локальные RBAC-списки ролей в `campaigns`, `calls`, `reports`, `usage`, `compliance`, `audit-logs` на вызовы authorizer.
- Свести доступы к SaaS v1 модели с alias-совместимостью для существующих тестов и mock-header режима.
- Обновить документацию endpoint-ов там, где сейчас перечислены устаревшие роли.

Где менять:

- `src/routes/campaigns.ts`
- `src/routes/calls.ts`
- `src/routes/reports.ts`
- `src/routes/usage.ts`
- `src/routes/compliance.ts`
- `tests/campaigns.create.test.ts`
- `tests/calls/sandbox-call.api.test.ts`
- `tests/campaign-audit-log.api.test.ts`
- `tests/reports/campaign-report.api.test.ts`
- `docs/calls-api.md`
- `docs/reports-api.md`
- `docs/compliance-api.md`
- `docs/audit-logs-api.md`
- `docs/security/rbac.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Перечисленные endpoints проверяют доступ через единый authorizer.
- В документации не осталось устаревших ролей как основного контракта v1.
- Regression-тесты подтверждают доступ `tenant_owner`/`campaign_manager`/`tenant_viewer` согласно SaaS v1 матрице.

### T-249: Упростить права на интеграции и credentials под SaaS v1

Статус: `done`

Что сделать:

- Зафиксировать, какие integration/credentials действия доступны только `tenant_owner`, а какие допустимы `campaign_manager`.
- Привести `telephony` и `provider credentials` endpoints к этой модели.
- Сохранить audit trail для критичных действий: создание, обновление, ротация, disable.

Где менять:

- `src/routes/telephony*.ts`
- `src/routes/provider-credentials*.ts`
- `tests/telephony.routes.test.ts`
- `tests/provider-credentials.api.test.ts`
- `docs/security/rbac.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Для integration/credentials endpoints задокументирован один простой контракт SaaS v1.
- `tenant_owner` проходит критичные действия, роль без прав получает `FORBIDDEN`.
- Audit trail не ослаблен относительно текущего поведения.

### T-250: Разрешать роль пользователя из membership-модели

Статус: `done`

Что сделать:

- Подключить разрешение канонической tenant-роли из membership-связи пользователя и tenant.
- Сохранить `X-User-Role` как dev fallback до завершения real auth волны.
- Явно развести `tenant` и `platform` membership, чтобы platform-роль не подменяла tenant-роль.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/domain/user/*`
- `src/server/middleware/*auth*`
- `src/server/middleware/*role*`
- `tests/domain-tenant.test.ts`
- `tests/*auth*`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- При наличии membership роль определяется из данных приложения, а не только из mock-header.
- `platform_admin` без tenant membership не становится `tenant_owner`.
- Header-based dev fallback продолжает работать.

### T-251: Добавить минимальный tenant users API и аудит изменения ролей

Статус: `done`

Что сделать:

- Добавить минимальный API списка пользователей организации и смены роли внутри tenant.
- Разрешить управление пользователями только роли `tenant_owner`.
- Логировать изменение роли и состава пользователей tenant в `AuditLog`.

Где менять:

- `src/routes/tenant-users.ts`
- `src/server/app.ts`
- `src/domain/audit-log/*`
- `tests/*tenant-user*`
- `docs/security/rbac.md`
- `README.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- Список пользователей tenant доступен только с корректным tenant context.
- Смена роли доступна только `tenant_owner`.
- Каждое изменение роли оставляет audit event.

### T-252: Добавить минимальный support access path

Статус: `done`

Что сделать:

- Зафиксировать и реализовать минимальный `SupportAccessGrant` или эквивалентный механизм временного доступа поддержки.
- Ограничить `support_engineer` доступом только через явный support path, а не постоянной platform-ролью.
- Логировать выдачу, использование и отзыв support-доступа.

Где менять:

- `src/db/prisma/schema.prisma`
- `src/domain/*support*`
- `src/routes/*support*`
- `tests/*support*`
- `docs/security/rbac.md`
- `docs/superpowers/specs/2026-08-19-rbac-role-model-design.md`
- `TECH_BACKLOG_1SP.md`

Критерии готовности:

- У поддержки нет постоянного tenant-доступа по умолчанию.
- Временный доступ требует явного grant и проверяется сервером.
- Audit log фиксирует жизненный цикл support-доступа.

## Журнал изменений плана

- 19.08.2026: GitHub Pages лендинг `public/index.html` переписан: короче copy, один главный CTA в hero, sticky-плашка только на мобиле. Проверка: `npx vitest run tests/public-landing.test.ts`. На github.io попадёт только после commit+push в `main` (workflow смотрит `public/**`).

- 19.08.2026: после упрощения спеки `docs/superpowers/specs/2026-08-19-rbac-role-model-design.md` добавлена отдельная волна `P1. RBAC SaaS v1` (`T-245`–`T-252`) и сохранён план `docs/superpowers/plans/2026-08-19-rbac-saas-v1.md`; новая очередь покрывает канонические роли, role normalization, единый authorizer, миграцию существующих endpoints, membership-based role resolution, tenant user management и support access path.

- 19.08.2026: `T-245`–`T-252` done: `docs/security/rbac.md` синхронизирован с SaaS v1; добавлены canonical role normalization и единый zone-based authorizer; routes `campaigns/calls/reports/usage/compliance/telephony/provider-credentials/tenants` переведены на новый доступ; введены `TenantMembership` / `PlatformMembership` / `SupportAccessGrant`; добавлены `tenant users API` и `support access` routes; session tenant scope сверяется с `:tenantId`, а роль берётся из membership, а не из stale snapshot. Проверка: `npm run typecheck`; `npm run test -- tests/auth/auth-context.middleware.test.ts tests/auth/register-login.api.test.ts tests/provider-credentials.api.test.ts tests/telephony.routes.test.ts tests/campaigns.create.test.ts tests/tenant-users.api.test.ts tests/support-access.api.test.ts`.

- 19.08.2026: `T-244` done: лендинг, email/password auth, cookie-сессия и переход в `prototype.html`. Проверка: `npx vitest run tests/auth tests/landing-auth-pages.test.ts tests/prototype-auth-session.test.ts tests/prototype-wizard-create.test.ts tests/campaigns.create.test.ts`.

- 19.08.2026: Ревью backlog; добавлены волны 11–13 (`T-230`–`T-243`), обновлена шапка as-is (19.08.2026), внешние блокеры legal/DPA зафиксированы. `T-231` done: ROADMAP §8, technology-map §2, prd-open-questions §6–7. Первая `todo`: `T-230`. Коммит: `T-229` + backlog.

- 19.08.2026: `T-230` done: `npm run typecheck` (0 ошибок) и `npm run test` (391/391) прошли после ослабления типов в тестах и точечных правок в `src/` для совместимости с актуальными дженериками Fastify/Prisma. Изменено: `src/server/app.ts`, `src/server/index.ts`, `src/routes/campaigns.ts`, `src/routes/usage.ts`, `src/routes/reports.ts`, `src/reports/campaign-report.ts` и тесты `tests/*`.

- 19.08.2026: `T-232` done: в `prototype.html` добавлена загрузка списка кампаний через `fetch(${reportApiBaseUrl}/tenants/${context.tenantId}/campaigns)` и рендер строк в `#homeCampaignsBody` (с обработкой empty/error и обновлением кликов/checkbox через делегирование). Тест обновлён/добавлен для проверки отсутствия demo/local. Проверка: `npm run test -- tests/prototype-campaigns-list.test.ts tests/prototype-home-risk.test.ts`.
- 19.08.2026: `T-233` done: в `prototype.html` обновлён `#wizardCreate` — теперь делает `POST ${reportApiBaseUrl}/campaigns` с заголовками `X-Tenant-Id`/`X-User-Role` и при успехе проставляет `campaignWorkspace.dataset.campaignId` перед переходом на вкладки. На ошибках показывается inline error в `campaignStatePanel` (wizardStepStates.campaign.status/reasons). Добавлен тест `tests/prototype-wizard-create.test.ts`. Проверка: `npm run test -- tests/prototype-wizard-create.test.ts tests/prototype-nav.test.ts`.
- 19.08.2026: `T-234` done: импорт на шаге «База» в `prototype.html` переведён на `POST /tenants/:tenantId/campaigns/:campaignId/debtors/import` с `csvContent`/`xlsxBase64`; счётчики и список ошибок теперь строятся по `acceptedCount`, `rejectedCount`, `errors`, а copy явно разделяет «принято в базу» и «допущено к звонку». Обновлены метрики вкладки «База» и тесты `tests/prototype-import-mapping.test.ts`, `tests/prototype-import-report.test.ts`. Проверка: `npm run test -- tests/prototype-import-mapping.test.ts tests/prototype-import-report.test.ts tests/prototype-nav.test.ts`.
- 19.08.2026: `T-235`–`T-243` done: кабинет бьёт в PATCH status / report / sandbox; live skeleton `POST .../calls/live` (403 без флага); orchestrator stub без дубля usage; `GET /tenants/:tenantId/analytics/summary`; payment outcome в CallResult+report; CDR reconciliation stub. Проверка: `npm run typecheck`; `npm run test` (429/429).

- 18.08.2026: `T-229` done; клиентский кабинет пересобран по CJ-спеке. Проверка: `npm run test -- tests/prototype-*.test.ts`.

- 18.08.2026: Hotfix кабинета: в `prototype.html` у `showCampaignTab` не было закрывающей `}`, из‑за этого инлайн-скрипт не парсился и кроме статичной «Главной» навигация не работала. Проверка: `npm run test -- tests/prototype-nav.test.ts`.

- 17.08.2026: `T-160` переведена в `done`; `SANDBOX_CALLS_QUEUE_ENABLED` default false, auto_paused job skip, sync sandbox сохранён. Проверка: `npm run test -- tests/jobs/call-jobs.test.ts tests/calls/sandbox-call.api.test.ts`. Следующая: `T-162`.

- 17.08.2026: `T-159` переведена в `done`; BullMQ skeleton + ping worker без живого Redis в unit-тестах. Проверка: `npm run test -- tests/jobs/queue.test.ts`. `tsc` по-прежнему красный на старых ошибках.

- 17.08.2026: `T-158` переведена в `done`; `docker-compose.yml` PostgreSQL 16 + Redis, README/`REDIS_URL`.

- 17.08.2026: `T-156` переведена в `done`; скелеты Yandex ASR/TTS/GPT без HTTP. Проверка: `npm run test -- tests/speech/yandex-skeleton.test.ts`.

- 17.08.2026: `T-155` переведена в `done`; DialogueStateMachine без вендора. Проверка: `npm run test -- tests/dialogue/state-machine.test.ts`.

- 17.08.2026: `T-154` переведена в `done`; `docs/dialogue/state-machine-v1.md`.

- 17.08.2026: `T-153` переведена в `done`; схема `PromptVersion`. Проверка: `npm run test -- tests/domain-prompt-version.test.ts`.

- 17.08.2026: `T-152` переведена в `done`; LLM `completeTurn` + allowlisted tools + identity gate на `confirm_ptp`. Проверка: `npm run test -- tests/dialogue/llm-adapter.test.ts`. Следующая: `T-153`.

- 17.08.2026: `T-151` переведена в `done`; TTS adapter + fake buffer/`memory://`. Проверка: `npm run test -- tests/speech/tts-adapter.test.ts`.

- 17.08.2026: `T-150` переведена в `done`; ASR adapter + fake partials/confidence/timestamps. Проверка: `npm run test -- tests/speech/asr-adapter.test.ts`. Следующая: `T-151`.

- 17.08.2026: `T-195` переведена в `done`; скелет Mango без HTTP, `mango` в resolver. Проверка: `npm run test -- tests/telephony/mango-adapter.test.ts`. Следующая: `T-150`.

- 17.08.2026: `T-148` переведена в `done`; `LIVE_CALLS_ENABLED` default false, `isLiveCallsEnabled()`, невалидное значение падает на Zod. Проверка: `npm run test -- tests/config/env.test.ts`. Следующая: `T-195`.

- 17.08.2026: `T-147` переведена в `done`; контракт live-call API в docs, без кода маршрута, вендорский робот запрещён. Следующая: `T-148`.

- 17.08.2026: `T-146` переведена в `done`; sandbox API только `mode=sandbox` (`SANDBOX_CONNECTION_REQUIRED`); sandbox-канал readiness без production gates. Проверка: `npm run test -- tests/calls/sandbox-call.api.test.ts tests/campaigns.create.test.ts`. Следующая: `T-147`.

- 17.08.2026: `T-145` переведена в `done`; скелет Exolve без HTTP, `mapVendorStatus`, пустые `EXOLVE_*`. Проверка: `npm run test -- tests/telephony/exolve-adapter.test.ts`. Следующая: `T-146`.

- 17.08.2026: `T-144` переведена в `done`; `createVoiceProviderResolver`, unknown → `422 UNKNOWN_VOICE_PROVIDER`. Проверка: `npm run test -- tests/telephony/provider-resolver.test.ts tests/calls/sandbox-call.api.test.ts`. Следующая: `T-145`.

- 17.08.2026: `T-143` переведена в `done`; locked disclosure `agentName`/`agentId`/`creditorName` в JSON content. Проверка: `npm run test -- tests/scripts.api.test.ts tests/domain-script-version.test.ts`. Следующая: `T-144`.

- 17.08.2026: `T-142` переведена в `done`; PATCH telephony provider + `TELEPHONY_PROVIDER_LOCKED` при running/auto_paused; campaign connection lock покрыт и для auto_paused. Проверка: `npm run test -- tests/telephony.routes.test.ts tests/campaigns.create.test.ts`. Следующая: `T-143`.

- 17.08.2026: `T-141` переведена в `done`; production readiness требует stored probe marking+recording+handoff (`TELEPHONY_PROBE_INCOMPLETE`), `sandboxPass` не считается live. Проверка: `npm run test -- tests/campaigns.create.test.ts tests/domain-telephony-connection.test.ts`. Следующая: `T-142`.

- 17.08.2026: `T-140` переведена в `done`; `probeCapabilities()` на adapter, sandbox без live-маркировки. Проверка: `npm run test -- tests/telephony`. Следующая: `T-141`.

- 17.08.2026: `T-139` переведена в `done`; production-ready без `legalBasis=confirmed` → `LEGAL_BASIS_NOT_CONFIRMED`. Проверка: `npm run test -- tests/campaigns.create.test.ts tests/calls/sandbox-call.api.test.ts`. Следующая: `T-140`.

- 17.08.2026: `T-138` переведена в `done`; `Tenant.legalBasisStatus` default `pending`. Проверка: `npm run test -- tests/domain-tenant.test.ts`. Следующая: `T-139`.

- 17.08.2026: `T-137` переведена в `done`; `SUPPRESSION_BLOCK` по phone/`externalId`. Проверка: `npm run test -- tests/compliance`. Следующая: `T-138`.

- 17.08.2026: `T-136` переведена в `done`; схема `SuppressionEntry`. Проверка: `npm run test -- tests/domain-suppression-entry.test.ts`. Следующая: `T-137`.

- 17.08.2026: `T-135` переведена в `done`; sandbox не инкрементирует frequency ledger. Проверка: `npm run test -- tests/calls/sandbox-call.api.test.ts tests/compliance/frequency-ledger.test.ts`. Следующая: `T-136`.

- 17.08.2026: `T-134` переведена в `done`; `FREQUENCY_LIMIT_BLOCK` до старта звонка, caps 1/2/8. Проверка: `npm run test -- tests/compliance`. Следующая: `T-135`.

- 17.08.2026: `T-133` переведена в `done`; идемпотентный инкремент frequency ledger с `ringing`. Проверка: `npm run test -- tests/compliance/frequency-ledger.test.ts`. Следующая: `T-134`.

- 17.08.2026: `T-132` переведена в `done`; схема `FrequencyLedger` + продуктовые caps 1/2/8. Проверка: `npm run test -- tests/domain-frequency-ledger.test.ts`. Следующая: `T-133`.

- 17.08.2026: `T-131` переведена в `done`; продуктовый календарь праздников РФ 2026–2027, окно 09–20. Проверка: `npm run test -- tests/compliance`. Следующая: `T-132`.

- 17.08.2026: `T-130` переведена в `done`; окно будни 08–22 / выходные 09–20 по timezone. Проверка: `npm run test -- tests/compliance`. Следующая: `T-131`.

- 17.08.2026: `T-191` переведена в `done`; маскировка телефона в audit metadata (`src/logging/mask.ts`). Проверка: `npm run test` (228). Следующая: `T-130`.

- 17.08.2026: `T-190` переведена в `done`; `displayName`/`agreementRef` на DebtorRecord и в CSV (опционально). Проверка: `npm run test -- tests/import`. Следующая Lab: `T-191`.

- 17.08.2026: `T-189` переведена в `done`; GitHub Actions CI (`npm ci`, `typecheck`, `test`) без секретов и без Postgres service. Проверка: файл workflow + `npm run test`. Следующая Lab: `T-190`. Известно: `tsc --noEmit` ещё красный на старых ошибках.

- 17.08.2026: `T-188` переведена в `done`; `CallAttempt.scriptVersionId`, sandbox пишет активную версию, иначе 409 `SCRIPT_VERSION_MISSING`. Проверка: `npm run test -- tests/calls/sandbox-call.api.test.ts`. Следующая Lab: `T-189`.

- 17.08.2026: `T-187` переведена в `done`; `POST .../safe-resume` с чеклистом, `PATCH` из `auto_paused` закрыт, audit `campaign.safe_resumed`. Проверка: `npm run test -- tests/campaign-auto-pause.test.ts tests/campaigns.create.test.ts`. Следующая Lab: `T-188`.

- 17.08.2026: `T-186` переведена в `done`; sandbox уважает blocked/stale readiness (409 `CAMPAIGN_NOT_READY`). Общий модуль `src/campaigns/readiness.ts`. Проверка: `npm run test -- tests/calls/sandbox-call.api.test.ts tests/campaigns.create.test.ts`. Следующая Lab: `T-187`.

- 17.08.2026: `T-185` переведена в `done`; `Campaign.telephonyConnectionId` + PATCH bind, tenant-scoped, lock на running. Readiness и sandbox используют выбранное соединение. Проверка: `npm run test -- tests/campaigns.create.test.ts tests/calls/sandbox-call.api.test.ts`. Следующая Lab: `T-186`.

- 17.08.2026: `T-184` переведена в `done`; `POST /scripts` на `running` → 409 `SCRIPT_VERSION_LOCKED`, версия не создаётся. На `review` create сохранён. Проверка: `npm run test -- tests/scripts.api.test.ts`. Следующая Lab: `T-185`.

- 17.08.2026: `T-129` переведена в `done`; `ConsentStatusRule` блокирует `pending` кодом `CONSENT_PENDING_BLOCK` (пропускает только `given`). Sandbox с `pending` не создаёт `CallAttempt`. Rulebook R-CONSENT: Lab/Pilot внедрён. Проверка: `npm run test -- tests/compliance tests/calls/sandbox-call.api.test.ts`. Следующая Lab: `T-184`.

- 17.08.2026: UX-волна кабинета `T-205`–`T-228` по аудиту `docs/product/2026-08-17-ux-audit-cabinet.md`. Порядок: вход (Главная / список / шапка автопаузы) → глобальная очередь проверок → тест ≠ запуск → review не resume → readiness → импорт (backend RU, отчёт, маппинг, вкладка «База») → мастер шаг 1 → журнал/карточка звонка → источники/сценарии/nav → pause/stop → отчёт/копирайт. Lab `T-129+` не сдвинута. Не вошли: identity-бейдж (ждёт `T-201`), download проблемных строк (нет API), live vs sandbox как legalBasis (нет поля; в `T-210` только sandbox), SMS/email follow-up, типы review сверх `qa`/`compliance`. `T-225` стоп мапит UI на `completed`, пока нет отдельного API `stopped`.

- 17.08.2026: Канон очереди — этот файл. Шапка заменена: as-is архитектуры, волны исполнения, `T-129` как следующая. UI BYOK перенесён в `T-181`–`T-183` (`D-014`–`D-016` → `split`). Добавлены пропуски Lab/pilot `T-184`–`T-204` (сценарий на running, связь кампании с телефонией, stale на sandbox, safe-resume, scriptVersion на звонке, CI, поля identity, маскировка логов, object storage, recording guard, GigaChat/Mango скелеты, handoff destination, golden set, extractor, XLSX, pilot cap, identityVerified, webhook inbox, retention stub, structured logger). `T-130`/`T-131`/`T-132` уточнены: не выдавать окно/1/2/8 за факт закона до memo.

- 17.08.2026: `T-161` `done` — ADR `docs/decisions/0005-byok-speech-llm.md` и спека `docs/superpowers/specs/2026-08-17-byok-speech-llm-design.md`. В backlog добавлены `T-162`–`T-180` (шифрование, store, API, probe, factory, readiness, usage/billing). UI — `T-181`–`T-183`. Первая задача волны BYOK-кода: `T-162` после Lab hardening / по очереди исполнения в шапке.

- 17.08.2026: В backlog добавлена волна `T-129`–`T-160` по `docs/compliance/rulebook-v1.md`, ADR 0003 и ADR 0004: pre-dial правила, live-гейты, скелеты Exolve/Yandex без сети, `blocked` HTTP-интеграции (`T-149`, `T-157`), docker-compose/BullMQ. Первая рекомендуемая задача: `T-129`.

- 17.08.2026: Добавлены `docs/compliance/rulebook-v1.md` (продуктовый каталог системных правил и legal-confirm до live), `docs/decisions/0003-live-voice-provider.md` (Exolve Voice API, запасной Mango, без вендорского робота как мозга) и `docs/decisions/0004-speech-llm-stack.md` (SpeechKit + YandexGPT, запасной GigaChat, своя state machine). PRD v0.3, карта технологий, `prd-open-questions.md` и `README.md` связаны со этими документами.

- 17.08.2026: Добавлен технический анализ стека `docs/architecture/2026-08-17-technology-map.md` (карта core/platform/adjacent решений по этапам 0–4 с учётом ФЗ‑230/152/126 и текущего as-is). PRD обновлён до v0.3: раздел 22 «Технологический контур», инварианты compliance в разделе 13. Ссылки добавлены в `README.md`, `ROADMAP_B2B_SAAS.md` и `docs/product/prd-open-questions.md`.

- 17.08.2026: `T-128` переведена в `done`; починено переключение разделов кампании в `prototype.html`:
  - убраны лишние `</div>` в экранах `launch` и `report`, из-за которых «Звонки», «Проверка», «Отчёт» и «Настройки» оказывались вне рабочей области кампании;
  - возвращена вкладка «Телефония»;
  - добавлен `tests/prototype-campaign-views.test.ts`;
  - проверка: `npm run test -- tests/prototype-campaign-views.test.ts`.

- 17.08.2026: `T-127` переведена в `done`; в `prototype.html` вычищены пользовательские тексты и лишние вкладки кабинета:
  - удалены сайдбар-блоки «Готовность к запуску» / «MVP IA», hero на главной, кнопка симуляции автопаузы, дубль `reviewDrawer` и переключатель роли в отчёте;
  - глобальная навигация: Главная, Кампании, Источники, Очередь проверок, Журнал действий;
  - вкладки кампании без «Телефония», `Review` переименован в «Проверка»;
  - видимые строки переведены на речь оператора (`тестовый обзвон`, `проверка готовности`, `проверка ограничений`);
  - проверка: `node --check` для скрипта `prototype.html`.

- 17.08.2026: `T-126` переведена в `done`; добавлено логирование срабатываний rate limiting:
  - middleware `src/server/middleware/rate-limit.ts` расширен payload-ом (`tenantId`, `requestPath`, `requestId`, `windowMs`, `limit`, `used`, `resetAt`, `ip`, `method`, `statusCode`, `errorCode`) и поддержкой `onLimitExceeded`;
  - `src/server/app.ts` подключен callback, создающий `AuditLog` `security.rate_limit_exceeded` (`auditLog.create`) с метаданными лимита;
  - callback защищён `try/catch`, чтобы ошибка аудита не нарушала выдачу `429`;
  - `tests/rate-limit.api.test.ts` обновлен проверкой payload callback при превышении лимита;
  - проверки: `npm run test tests/rate-limit.api.test.ts`.

- 17.08.2026: `T-125` переведена в `done`; добавлен глобальный rate-limit middleware:
  - добавлен `src/server/middleware/rate-limit.ts` с лимитированием запросов по `request.ip` и окну времени;
  - middleware подключён в `src/server/app.ts` как глобальный `preHandler` с дефолтами из `env`;
  - в `src/config/env.ts` и `.env.example` добавлены `API_RATE_LIMIT_MAX_REQUESTS` (120) и `API_RATE_LIMIT_WINDOW_MS` (60000);
  - добавлен `tests/rate-limit.api.test.ts` с regression на третью блокировку после 2 успешных запросов в том же окне;
  - проверки: `npm run test tests/rate-limit.api.test.ts`.

- 17.08.2026: `T-124` переведена в `done`; добавлен `roleMiddleware` с ролями `owner`, `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin` для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`.
- в `tests/campaign-audit-log.api.test.ts` добавлены проверки `USER_ROLE_MISSING`/`FORBIDDEN` и позитивы по `owner` для обоих audit-logs endpoints;
- `docs/security/rbac.md`, `docs/audit-logs-api.md` и `README.md` синхронизированы по правам доступа для audit-logs.
- проверки: `npm run test tests/campaign-audit-log.api.test.ts`.

- 16.08.2026: `T-123` переведена в `done`; добавлен `docs/campaigns-api.md` с route-level контрактом для:
- `GET /tenants/:tenantId/campaigns` и `GET /tenants/:tenantId/campaigns/:campaignId`, включая tenant isolation, RBAC, ошибки, поля ответа и пагинацию списка (`limit`/`offset`, `limit` 1..100 по умолчанию `20`, `offset` 0..1000).
- В `README.md` добавлена ссылка на `Campaigns API`, endpoint-list для `GET /tenants/:tenantId/campaigns`, `GET /tenants/:tenantId/campaigns/:campaignId`, и примечание по параметрам пагинации для `GET /tenants/:tenantId/campaigns`.
- Проверки: документ-only изменение (`docs/campaigns-api.md`, `README.md`), в API-контракте синхронизированы query-параметры.

- 16.08.2026: `T-122` переведена в `done`; защищены RBAC для чтения кампаний:
- `GET /tenants/:tenantId/campaigns` и `GET /tenants/:tenantId/campaigns/:campaignId` с ролями `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- в `src/routes/campaigns.ts` добавлены middleware `roleMiddleware`.
- в `tests/campaigns.create.test.ts` добавлены 401/403 для read-endpoint, а успешные сценарии переведены на `X-User-Role`.
- в `docs/security/rbac.md` и `README.md` добавлены требования по ролям для read-campaign endpoints.
- проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-121` переведена в `done`; добавлен `roleMiddleware` для `PATCH /tenants/:tenantId/campaigns/:campaignId/status` с ролями `owner`, `collection_manager`.
- в `src/routes/campaigns.ts` защищён статусный endpoint RBAC.
- в `tests/campaigns.create.test.ts` добавлены проверки `USER_ROLE_MISSING`, `FORBIDDEN` и успешный сценарий со `X-User-Role: owner`.
- в `docs/security/rbac.md` и `README.md` добавлены требования по ролям для смены статуса кампании.
- проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-120` переведена в `done`; добавлен `roleMiddleware` с ролями `owner`, `collection_manager`, `qa_analyst`, `compliance_officer` для `PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa`.
- в `src/routes/qa.ts` защищён endpoint RBAC.
- в `tests/calls/sandbox-call.api.test.ts` добавлены проверки на `USER_ROLE_MISSING`, `FORBIDDEN` и успешный апдейт по роли `qa_analyst`.
- в `docs/calls-api.md`, `docs/security/rbac.md`, `README.md` добавлены требования и роли для QA-эндпоинта.
- проверки: `npm run test tests/calls/sandbox-call.api.test.ts`.

- 16.08.2026: `T-117` переведена в `done`; синхронизирована документация для `Calls API`:
  - в `docs/calls-api.md` добавлены ошибки `401 USER_ROLE_MISSING` и `403 FORBIDDEN` для `POST /.../calls/sandbox`, `GET /.../calls`, `GET /.../calls/:callAttemptId`;
  - для всех защищённых call endpoints в `docs/calls-api.md` явно указаны роли доступа;
  - в `README.md` добавлена заметка про `X-User-Role` для sandbox и чтения звонков;
  - проверки: `npm run test tests/calls/sandbox-call.api.test.ts` (для подтверждения, что API контракт уже покрыт тестами RBAC).

- 16.08.2026: `T-116` переведена в `done`; для `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` добавлен RBAC:
  - в `src/routes/campaigns.ts` добавлен `preValidation: roleMiddleware(['owner', 'collection_manager', 'operator', 'qa_analyst', 'compliance_officer', 'integration_admin'])`;
  - в `tests/campaigns.create.test.ts` добавлены проверки на `USER_ROLE_MISSING` и `FORBIDDEN`, а успешные существующие кейсы переведены на `X-User-Role`;
  - в `docs/campaign-readiness-api.md` добавлен RBAC-раздел и ошибки `USER_ROLE_MISSING`, `FORBIDDEN`;
  - проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-115` переведена в `done`; report endpoint закрыт RBAC:
  - в `src/routes/reports.ts` добавлен `preValidation: roleMiddleware(['owner', 'collection_manager', 'operator', 'qa_analyst', 'compliance_officer', 'integration_admin'])` на `GET /tenants/:tenantId/campaigns/:campaignId/report`;
  - в `tests/reports/campaign-report.api.test.ts` добавлены helper-обертки `injectWithRole`/`injectWithOwnerRole`, обновлены успешные кейсы с `X-User-Role`, добавлены проверки `401 USER_ROLE_MISSING` и `403 FORBIDDEN`;
  - в `docs/reports-api.md` добавлены RBAC-раздел и ошибки `USER_ROLE_MISSING`, `FORBIDDEN`;
  - проверки: `npm run test tests/reports/campaign-report.api.test.ts`.

- 16.08.2026: `T-114` переведена в `done`; добавлен RBAC для usage-ledger API:
  - в `src/routes/usage.ts` подключен `roleMiddleware` для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` и `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` с ролями `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`;
  - в `tests/usage.api.test.ts` обновлены существующие успешные кейсы через `injectWithOwnerRole`, добавлены `injectWithRole`, плюс проверки `USER_ROLE_MISSING`/`FORBIDDEN` для обоих endpoints;
  - в `docs/usage-api.md` добавлены секции RBAC и ошибки `USER_ROLE_MISSING`/`FORBIDDEN`;
  - проверки: `npm run test tests/usage.api.test.ts`.

- 16.08.2026: `T-113` переведена в `done`; добавлен RBAC для `calls`-API:
  - в `src/routes/calls.ts` добавлены `roleMiddleware` для `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`, `GET /tenants/:tenantId/campaigns/:campaignId/calls`, `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`;
  - роли для sandbox-start: `owner`, `collection_manager`, `operator`; для чтения звонков: `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`;
  - в `tests/calls/sandbox-call.api.test.ts` добавлены проверки 401 (`USER_ROLE_MISSING`) и 403 (`FORBIDDEN`) для всех защищённых calls endpoints;
  - в `docs/calls-api.md` зафиксированы требования к ролям через `X-User-Role`;
  - проверки: `npm run test tests/calls/sandbox-call.api.test.ts`.

- 16.08.2026: `T-112` переведена в `done`; для `GET /tenants/:tenantId/campaigns/:campaignId/review-items` и `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve`:
  - добавлены `roleMiddleware(['owner', 'collection_manager', 'qa_analyst', 'compliance_officer'])` в `src/routes/campaigns.ts`;
  - добавлены/обновлены тесты с успешным проходом по разрешённым ролям и проверками 401 (`USER_ROLE_MISSING`) и 403 (`FORBIDDEN`);
  - в `docs/review-items-api.md` зафиксированы требования по ролям;  
  - проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-111` переведена в `done`; закрытие `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve` для compliance элементов теперь требует, чтобы решение в `complianceDecision` имело `decision: 'block'`:
  - в `src/routes/campaigns.ts` добавлен фильтр `decision: 'block'` в `complianceDecision.findMany`,
  - добавлен регрессионный кейс `returns 404 for compliance review item that is not blocked` в `tests/campaigns.create.test.ts` (проверяется отсутствие `auditLog.create` и `REVIEW_ITEM_NOT_FOUND`);
  - проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-110` переведена в `done`; добавлен `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve` в `src/routes/campaigns.ts`:
  - добавлен разбор `itemType` по `itemId` (`qa-`, `compliance-`);
  - для QA-элемента выполняются проверки tenant/campaign isolation, обновление `qaStatus` (`approve` -> `approved`, другие действия -> `flagged`) и аудит `review_item.resolved`;
  - для compliance-элемента добавлен аудит `review_item.resolved` и подтверждение `acknowledged`;
  - добавлены кейсы в `tests/campaigns.create.test.ts`:
    - успешное разрешение qa-item,
    - acknowledgment compliance-item,
    - валидация `INVALID_REVIEW_ITEM_ID`;
  - проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-109` переведена в `done`; добавлен `GET /tenants/:tenantId/campaigns/:campaignId/review-items` в `src/routes/campaigns.ts`:
  - endpoint собирает `qa` элементы из `callAttempt` с `callResult.qaStatus = 'flagged'` и `compliance` элементы из `complianceDecision` с `decision = 'block'`;
  - каждый элемент содержит `itemType`, `createdAt`, `retryCount`, `urgency`;
  - список сортируется по `createdAt` (desc), применяется `limit/offset`, и выполняется проверка tenant/campaign scope;
  - в `tests/campaigns.create.test.ts` добавлен тест `GET /tenants/:tenantId/campaigns/:campaignId/review-items`;
  - проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-108` переведена в `done`; в `src/routes/campaigns.ts` добавлена аудит-запись для `PATCH /tenants/:tenantId/campaigns/:campaignId/status` с `action: 'campaign.status_updated'` и `metadata: { campaignId, fromStatus, toStatus }`; в `tests/campaigns.create.test.ts` добавлен сценарий проверки `auditLog.create` на валидный переход статуса и проверка отсутствия записи на `INVALID_STATUS_TRANSITION`. Проверки: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-107` переведена в `done`; в `src/routes/calls.ts` добавлен унифицированный `evidenceBundle` в ответ `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId` (с вложениями `callResult`, `complianceDecisions`, `usageEvents`), контракт в `docs/calls-api.md` и проверка в `tests/calls/sandbox-call.api.test.ts` обновлена на новое поле. Проверка: `npm run test tests/calls/sandbox-call.api.test.ts`.

- 16.08.2026: `T-106` переведена в `done`; добавлен новый route-level документ `docs/tenant-billing-api.md` с контрактами:
  - `GET /tenants/:tenantId/billing/settings`
  - `PATCH /tenants/:tenantId/billing/settings`;
  `README.md` дополнен ссылкой на документ и перечислением обоих endpoints в разделе contract overview;
  в плане обновлены статусы и критерии;
  проверки кода не требовались (документационный шаг).

- 16.08.2026: `T-105` переведена в `done`; добавлены tenant billing settings API в `src/routes/tenants.ts`:
  - `GET /tenants/:tenantId/billing/settings` с `tenantId`-валидацией и resolved тарифом через tenant override или `env.BILLING_CONNECTED_MINUTE_RATE_RUB`;
  - `PATCH /tenants/:tenantId/billing/settings` с ролью `owner|integration_admin`, сохранением `connectedMinuteRateRub`, `tenant-scoped` проверками и audit log событием `tenant.billing_settings_updated`;
  - обновлен `src/server/app.ts` для регистрации новых маршрутов;
  - добавлены тесты `tests/tenants.billing-settings.api.test.ts` (8 кейсов);
  - проверка: `npm run test tests/tenants.billing-settings.api.test.ts`.

- 16.08.2026: `T-103` переведена в `done`; добавлена конфигурация тарифа через `BILLING_CONNECTED_MINUTE_RATE_RUB` в `src/config/env.ts` (+ `.env.example`) и её использование в `src/routes/reports.ts` через `env`; `src/domain/billing/index.ts` теперь валидирует положительность тарифного коэффициента; `createCampaignReport` принимает `billingRates` и считает `costPer*` через валидированный тариф; добавлены тесты в `tests/domain-billing.test.ts` и обновлены `tests/reports/campaign-report.test.ts`/`tests/reports/campaign-report.api.test.ts`. Проверки: `npm run test tests/reports/campaign-report.test.ts tests/reports/campaign-report.api.test.ts tests/domain-billing.test.ts`.

- 16.08.2026: `T-104` переведена в `done`; добавлено optional поле `connectedMinuteRateRub` в `Tenant` (nullable `Float`) и fallback-логика в `GET /tenants/:tenantId/campaigns/:campaignId/report`: для расчета `costPerCall` и `costPerPtp` используется `tenant.connectedMinuteRateRub`, а при отсутствии override — `env.BILLING_CONNECTED_MINUTE_RATE_RUB`; добавлены API-тесты tenant-override/fallback (`tests/reports/campaign-report.api.test.ts`), обновлена схема `src/db/prisma/schema.prisma` и миграция `src/db/migrations/0012_add_connected_minute_rate_to_tenant/migration.sql`.
- 16.08.2026: `T-102` переведена в `done`; создан модуль тарифов `src/domain/billing/index.ts` с константой `connectedMinuteRateRub` (v0: 1.20 ₽/мин) и хелпером расчета стоимости;
  `src/reports/campaign-report.ts` теперь использует этот тариф для `costPerCall` и `costPerPtp` через `calculateCostFromMinutes`; обновлены `tests/reports/campaign-report.test.ts` и `tests/reports/campaign-report.api.test.ts` с расчетом ожидаемого `expectedCost`.

- 16.08.2026: `T-100` переведена в `done`; в `prototype.html` добавлены IDs метрик и логика `syncCampaignOverviewMetricsFromReport`, которая подставляет значения overview KPI из `currentCampaignReportSnapshot` (live через `report` API или local через `getReportSnapshotFromCalls`). В `showCampaignTab('overview')` добавлен вызов синхронизации метрик; жёсткие статичные цифры в overview заменены на источник данных/`н/д` при отсутствии расчёта стоимости.

- 16.08.2026: `T-101` переведена в `done`; в `src/reports/campaign-report.ts` добавлены агрегации `connectedMinutes`, `costPerCall`, `costPerPtp` из `usage-events` (`call_completed` с `unit='minute'`, `call_completed` с `unit='call'` для completed calls) через `calculateUsageLedgerTotals`; в `src/routes/reports.ts` и `src/server/app.ts` расширены зависимости для `usageEvent.findMany`; в `tests/reports/campaign-report.test.ts` и `tests/reports/campaign-report.api.test.ts` добавлены проверки новых полей; в `prototype.html` добавлен рендер `reportMinutes` и парсинг `connectedMinutes`/`costPer*` из API-снапшота. Проверки: `npm run test tests/reports/campaign-report.test.ts tests/reports/campaign-report.api.test.ts`.

- 16.08.2026: `T-099` переведена в `done`; в `prototype.html` добавлена синхронизация вкладки `overview` через `readiness-summary` (через `buildReadinessSummaryFromApi` и новый `syncCampaignOverviewReadinessPanel`) с единой интерпретацией `stale` как блокирующего состояния до перепроверки зависимостей и с explicit notice/действием обновления проверок.

- 16.08.2026: `T-098` переведена в `done`; в `prototype.html` обновлен разбор ответа `readiness-summary` (через `buildReadinessSummaryFromApi`) с добавлением explicit action-подсказки при `stale`, а в `syncCampaignLaunchReadinessPanel` усилен текст состояния с указанием необходимости повторной проверки зависимостей; проверка реализована без изменения backend API.

- 16.08.2026: `T-097` переведена в `done`; добавлен регрессионный тест `returns stale readiness when campaign has no blockers but config changed after campaign update` в `tests/campaigns.create.test.ts` для `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`; тест проверяет `readinessState: 'stale'`, `blocked: false`, `stale: true`, пустые `reasons` и `complianceReasons`; проверка выполнена через `npm run test tests/campaigns.create.test.ts` (включая новый кейс).

- 16.08.2026: `T-096` переведена в `done`; в `prototype.html` добавлена интеграция `readiness-summary` для wizard readiness step и launch-панели: автоматический вызов `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` на шаге 5 мастера и вкладке `launch`, отображение `readinessState/blocked/stale` и причин в карточке readiness, блокировка кнопок `wizardControlledLaunch`/`launchCampaign` при `blocked`; ошибки API показаны как fallback без падения UI. Проверка: `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-094` переведена в `done`; добавлен `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` в `src/routes/campaigns.ts` с tenant/campaign isolation; в `tests/campaigns.create.test.ts` добавлены сценарии `ready` и `blocked` (проверка `blocked`/`reasons`/`complianceReasons`); проверка выполнена через `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-094` дополнена корректировкой: `complianceReasons` в `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` теперь включает `id` из `ComplianceDecision`, тест `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` в `tests/campaigns.create.test.ts` обновлен на `expect.objectContaining` для `reasons` (учтены поля `reasonText` и `nextAction`); проверка выполнена через `npm run test tests/campaigns.create.test.ts`.

- 16.08.2026: `T-095` переведена в `done`; добавлен route-level контракт `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` в `docs/campaign-readiness-api.md`, обновлен `README.md` (добавлена ссылка на документ и endpoint в списке контрактов); проверки кода не требовались, так как менялись только документационные артефакты.

- 16.08.2026: `T-093` взята в `doing` и завершена, добавлен `GET /tenants/:tenantId/campaigns/:campaignId/compliance-decisions` в `src/routes/compliance.ts` (tenant/campaign isolation, фильтр `decision`, пагинация), обновлены `src/routes/compliance.ts`-тесты в `tests/compliance`, контракт в `docs/compliance-api.md`, и список endpoint-ов в `README.md`.

- 16.08.2026: `T-092` переведена в `done`; добавлены `docs/compliance-api.md`, ссылка на него и endpoint `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check` в `README.md`.

- 16.08.2026: `T-092` добавлена в `doing` как новая 1 SP задача по документации endpoint ручной проверки compliance `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check`.

- 16.08.2026: `T-091` переведена в `done`; в `README.md` уточнен контракт `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` (без пагинации, формат ответа: `[ { eventType, unit, totalQuantity } ]`) для синхронизации с `docs/usage-api.md`.

- 16.08.2026: `T-090` переведена в `done`; в `README.md` добавлен endpoint `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` в API обзор, чтобы согласовать перечисление usage endpoints с `docs/usage-api.md`.

- 16.08.2026: `T-089` переведена в `done`; в `README.md` обновлена заметка по API-параметрам `GET /tenants/:tenantId/campaigns/:campaignId/calls` добавлением query-параметров `outcome` и `qaStatus` для синхронизации с `docs/calls-api.md`.

- 16.08.2026: `T-088` переведена в `done`; добавлена валидация query-параметров `outcome` и `qaStatus` в `GET /tenants/:tenantId/campaigns/:campaignId/calls` через `tenantCampaignCallsQuerySchema`; в `src/routes/calls.ts` добавлен фильтр по `callResult` с поддержкой обоих параметров; в `tests/calls/sandbox-call.api.test.ts` добавлены кейсы для фильтрации и валидации (`outcome`, `qaStatus`) + проверка `callAttempt.findMany`; в `docs/calls-api.md` обновлены query-параметры и контракт ошибки `VALIDATION_ERROR`; выполнена проверка `npm run test tests/calls/sandbox-call.api.test.ts` (21 passed).

- 16.08.2026: `T-087` переведена в `done`; добавлен route-level контракт для `GET /tenants/:tenantId/campaigns/:campaignId/report` в `docs/reports-api.md`; в `README.md` добавлены ссылка на `Campaign Report API` и endpoint-список для отчёта; выполнена проверка `npm run test tests/reports/campaign-report.api.test.ts` (4 passed).

- 16.08.2026: `T-086` переведена в `done`; добавлен route-level контракт в `docs/usage-api.md` для
  `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` и `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals`;
  зафиксированы параметры `limit/offset` и ошибки `VALIDATION_ERROR` для списка событий;
  в `README.md` добавлена ссылка на `Usage API` и endpoint `usage-events` в списке контрактов; выполнена проверка `npm run test tests/usage.api.test.ts` (9 passed).

- 16.08.2026: `T-085` переведена в `done`; в `src/routes/usage.ts` добавлена валидация query-параметров `limit/offset` для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` (`limit` по умолчанию `20`, `min 1`, `max 100`; `offset` по умолчанию `0`, `min 0`, `max 1000`), запрос в `usageEvent.findMany` расширен `skip`/`take`; в `tests/usage.api.test.ts` добавлены регрессионные кейсы по дефолтной пагинации, `limit=101`, `offset=1001`; в `README.md` добавлено примечание по пагинации usage-events; выполнена проверка `npm run test tests/usage.api.test.ts` (9 passed).

- 16.08.2026: `T-084` переведена в `done`; в `src/routes/calls.ts` добавлена валидация query-параметров `limit/offset` для `GET /tenants/:tenantId/campaigns/:campaignId/calls` (`limit` по умолчанию `20`, `min 1`, `max 100`; `offset` по умолчанию `0`, `min 0`, `max 1000`), запрос к `callAttempt.findMany` расширен `skip`/`take`; в `tests/calls/sandbox-call.api.test.ts` добавлены регрессионные кейсы на дефолтную пагинацию, `limit=101` и `offset=1001`; обновлены `docs/calls-api.md` и `README.md`; выполнена проверка `npm run test tests/calls/sandbox-call.api.test.ts` (18 passed).

- 16.08.2026: `T-083` переведена в `done`; в `src/routes/campaigns.ts` добавлена верхняя граница `offset` (`max: 1000`) для tenant- и campaign-scoped audit-log endpoints, добавлены тесты на `offset=1001` в `tests/campaign-audit-log.api.test.ts` для обоих endpoints с проверкой `400 + VALIDATION_ERROR`, обновлён `docs/audit-logs-api.md` и `README.md` (пагинация: `limit 1..100`, `offset 0..1000`), выполнена проверка `npm run test tests/campaign-audit-log.api.test.ts`.

- 16.08.2026: `T-082` переведена в `done`; в `README.md` добавлено примечание: для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` параметр `limit` имеет диапазон `1..100`, по умолчанию `20`, выполнена синхронизация с контрактом `docs/audit-logs-api.md`.

- 16.08.2026: `T-082` добавлена в backlog как задача по синхронизации `README.md` с обновленным контрактом `limit <= 100` для audit endpoints после `T-081`.

- 16.08.2026: `T-081` переведена в `done`; обновлён `docs/audit-logs-api.md` для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`: `limit` теперь описан как `max: 100`, в секции ошибок явно указано, что `limit > 100` даёт `VALIDATION_ERROR`, выполнена запись в журнале изменений плана.

- 16.08.2026: `T-081` добавлена в backlog как задача по синхронизации документации: обновление `docs/audit-logs-api.md` по `max limit=100` и `limit > 100` -> `VALIDATION_ERROR` после реализации `T-080`.

- 16.08.2026: `T-080` переведена в `done`; в `src/routes/campaigns.ts` добавлена верхняя граница `limit` (`max(100)`) для query-схем `tenant` и `campaign` `audit-logs`, в `tests/campaign-audit-log.api.test.ts` добавлены регрессионные тесты на `limit=101` для обоих endpoints с проверкой `400 + VALIDATION_ERROR`, выполнена проверка `npm run test tests/campaign-audit-log.api.test.ts`.

- 16.08.2026: `T-079` переведена в `done`; в `tests/campaign-audit-log.api.test.ts` добавлен регрессионный тест `uses default pagination when campaign audit log limit and offset are omitted`, который проверяет, что `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` без параметров `limit`/`offset` возвращает 20 записей в порядке `createdAt` (по убыванию, в соответствии с `orderBy` + срезом).

- 16.08.2026: `T-078` переведена в `done`; расширены query-параметры и поведение `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` в `src/routes/campaigns.ts` (добавлены и валидированы `action`, `entityType`, `limit`, `offset`, применена фильтрация и пагинация), добавлены тесты в `tests/campaign-audit-log.api.test.ts` (фильтры по `action`/`entityType`, `limit`/`offset`, ошибки валидации), выполнена проверка `npm run test tests/campaign-audit-log.api.test.ts`.

- 16.08.2026: `T-077` переведена в `done`; расширен `docs/audit-logs-api.md` для описания `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` (валидация пути `tenantId/campaignId`, filters `action/entityType/limit/offset`, ошибки `CAMPAIGN_NOT_FOUND`, пример ответа), в `README.md` добавлены ссылки на оба audit endpoints.

- 16.08.2026: `T-076` переведена в `done`; добавлен route-level контракт в `docs/audit-logs-api.md` для `GET /tenants/:tenantId/audit-logs` с query-параметрами `action`, `entityType`, `campaignId`, `limit`, `offset`, кодами и структурой ответа; в `README.md` добавлена ссылка на этот документ.

- 16.08.2026: `T-075` переведена в `done`; в `src/routes/campaigns.ts` расширен `GET /tenants/:tenantId/audit-logs` query-параметрами `action`, `entityType`, `campaignId`, `limit`, `offset` с фильтрацией и пагинацией в памяти. В `tests/campaign-audit-log.api.test.ts` добавлены кейсы фильтрации по action/entityType/campaignId и пагинации/валидации `limit`.

- 16.08.2026: `T-074` переведена в `done`; в `src/routes/campaigns.ts` добавлен endpoint `GET /tenants/:tenantId/audit-logs` (tenant-scoped, tenant isolation), в `tests/campaign-audit-log.api.test.ts` добавлены сценарии 200/400/404 и проверка вызова `auditLog.findMany` с `where: { tenantId }` и `orderBy: { createdAt: 'desc' }`.

- 16.08.2026: `T-072` переведена в `done`; в `prototype.html` добавлены ролевые срезы отчёта (`collection_manager`, `supervisor`, `compliance_officer`), разнесены блоки на operational/business/risk, добавлен drill-down из KPI в:
  - журнал звонков с фильтрами по исходу/QA/комплаенс-ограничению,
  - review очереди по статусу/приоритету.
  В `ROADMAP_B2B_SAAS.md` обновлён раздел `Design Update` с фиксированием роли-ориентированных отчётных path.
- 16.08.2026: `T-073` переведена в `done`; обновлена валидация `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` для `campaignId` из контрактов (без UUID-ограничения), обновлены ожидания в `tests/calls/sandbox-call.api.test.ts` по `auditLog.metadata` (`campaignId`, `reasons`, `rules`) для сценариев QA/sandbox call.

- 16.08.2026: `T-071` переведена в `done`; в `prototype.html` доработан UX flow автопаузы:
  - разделены экшены для `manual_paused` (`Снять паузу`) и `auto_paused` (`Безопасное возобновление`);
  - для `campaign.auto_paused` добавлены отдельные поля в runtime-панели (`Ключ риска`, `Причина автопаузы`, `Какой impact зафиксирован`);
  - `resume` для `auto_paused` теперь открывает safe-resume панель и требует 3 чекбокса перед переходом в `running`;
  - транзакции ручного и безопасного возобновления теперь явно отражаются в activity trail;
  - в `docs/operations/auto-pause.md` добавлены явные разделы по `manual_paused`, `auto_paused`, `stopped` и требованиям safe-resume.

- 16.08.2026: `T-069` переведена в `done`; в `prototype.html` доработана очередь review: реализован campaign-scope по URL из отчёта/вкладки кампании, фильтрация карточек по кампании и фильтрам статуса/приоритета/источника/типа, добавлена метрика `Старше 30 мин`, а также расширена карточка review item блоками контекста (срок, ответственный, следующий шаг) и разнесены compliance/технические логи с сохранением кампанийного скоупа; в `docs/security/rbac.md` уточнены права `qa_analyst` и `compliance_officer` по работе с review queue.

- 16.08.2026: `T-068` переведена в `done`; в `prototype.html` обновлён экран readiness/launch:
  - добавлены детализированные причины в чеклисте шага `readiness` и экрана `launch`;
  - введена единая синхронизация `syncCampaignLaunchReadinessPanel(...)` между wizard и вкладкой запуска кампании;
  - реализованы guard-цепочки для кнопок `wizardControlledLaunch` и `launchCampaign` по состоянию `readiness` (запрет запуска при `disabled`);
  - в `docs/operations/auto-pause.md` зафиксированы состояния `готово/нужна проверка/автопауза/заблокировано compliance/ожидает подтверждения` как часть контролируемого запуска.

- 16.08.2026: `T-067` переведена в `done`; в `prototype.html` уточнён мастером создания кампании state-model под backend-like контракт (`status`, `blockingReasons`, `nextActions`, `source`/`correlationId`) для шагов кампании/импорта/телефонии/сценария с явными действиями после error/partial/review; в `ROADMAP_B2B_SAAS.md` добавлен раздел о контракте экранных статусов и обязательных follow-up действиях.

- 16.08.2026: `T-066` (операторский MVP IA) выполнена: зафиксирована каноническая навигация по ролям `collection_manager`, `qa_analyst`, `compliance_officer`, `integration_admin` в `docs/product/prd-open-questions.md` и обновлён прототипный `prototype.html` (канонический top-level/ролевой флоу + entry points).
- 16.08.2026: `T-066` переведена в `done`; добавлен раздел "API документация MVP (route-level)" в `README.md` с ссылками на `docs/telephony-api.md` и `docs/calls-api.md`.
- 16.08.2026: `T-070` переведена в `done`; в `prototype.html` доработана карточка звонка под единый QA/compliance flow (исход/статус/источник, decision + evidence, transcript/recording/timeline в одной карточке), добавлены подсказки по разделению inline- и full-review, и улучшена ручная QA-интеракция в строке + карточке.

- 16.08.2026: Добавлен блок UX/design задач `T-065`-`T-072` для закрытия разрыва между backend-ready MVP Lab и пользовательским операторским контуром; roadmap дополнен качественной оценкой завершённости по этапам.

- 16.08.2026: `T-065` переведена в `done`; добавлен `docs/calls-api.md` с route-level описаниями `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`,
  `GET /tenants/:tenantId/campaigns/:campaignId/calls` и `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`, включая коды ответов,
  структуры payload/response и требования tenant isolation + compliance gate для стартов.

- 16.08.2026: `T-065` выполнена; в `ROADMAP_B2B_SAAS.md` добавлен зафиксированный UX-gap-аудит всего потока `создание кампании → импорт → readiness → launch → calls → review → report`, а в `docs/product/prd-open-questions.md` добавлен registry критических разрывов по этапам для приоритезации MVP vs Controlled Pilot.

- 16.08.2026: `T-064` переведена в `done`; добавлен `docs/telephony-api.md` с актуальным описанием `GET/POST /tenants/:tenantId/telephony-connections`, ограничениями ролей и кодами ошибок (`400`, `401`, `403`, `404`, `422`) и tenant isolation.

- 16.08.2026: `T-061` переведена в `done`; реализовано API `GET/POST /tenants/:tenantId/telephony-connections` с tenant isolation и валидацией payload в `src/routes/telephony.ts`, подключено в `src/server/app.ts`, добавлены tests в `tests/telephony.routes.test.ts`.
- 16.08.2026: `T-062` переведена в `done`; в `src/routes/telephony.ts` добавлена проверка `actor` (`deps.user.findFirst`) и запись `telephony_connection.created` в `AuditLog` для `POST /tenants/:tenantId/telephony-connections`, в `tests/telephony.routes.test.ts` добавлен кейс `422` при отсутствии активного пользователя и проверка вызова `auditLog.create` в успешном сценарии.
- 16.08.2026: `T-063` переведена в `done`; в `src/routes/telephony.ts` добавлена роль-based защита `roleMiddleware` для GET (`owner`/`collection_manager`/`integration_admin`) и POST (`owner`/`integration_admin`) и в `tests/telephony.routes.test.ts` добавлены проверки `USER_ROLE_MISSING` и `FORBIDDEN`, сохранив tenant isolation и аудит при успешном POST.

- 16.08.2026: `T-060` переведена в `done`; создан `docs/enterprise/on-prem-assessment.md` с enterprise checklist по данным, секретам, телефонии, storage, observability и обновлениям.

- 16.08.2026: `T-059` переведена в `done`; обновлён `docs/integrations/voice-provider-adapter.md` с multi-provider паттерном (resolver, запрет vendor-специфичных полей в домене, порядок подключения второго провайдера без изменений `POST /calls/sandbox`).

- 16.08.2026: `T-057` переведена в `done`; создан `docs/integrations/external-systems.md` с перечнем направлений интеграции (API/SFTP/webhooks), contract-описанием импортов/экспорта/статусов, и правилами идемпотентности для входящих событий на основе `eventId` + `sourceSystem` (`idempotencyKey`), включая требования к повторной доставке и аудит-метаданным (`sourceSystem`, `idempotencyKey`, `eventId`, `processedAt`).

- 16.08.2026: `T-058` переведена в `done`; создан `docs/billing/billing-model-v0.md` с billing units v0 (connected minute, successful dialog, storage), описанием источников метрик и привязки к usage-событиям (`call_completed` по `unit=minute/call`) для будущей интеграции с биллингом.

- 16.08.2026: `T-056` переведена в `done`; создан decision doc `docs/decisions/0002-sso-approach.md` с подходом к миграции от MVP header-based mock-auth к OIDC и SAML (поэтапный путь: MVP mock-auth → OIDC → SAML по enterprise-требованиям).

- 16.08.2026: `T-055` переведена в `done`; добавлен сервис `calculateUsageLedgerTotals` в `src/domain/usage-ledger/index.ts` (агрегация `quantity` по `eventType` + `unit` с дедупликацией `sourceId`), добавлен endpoint `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` в `src/routes/usage.ts` для tenant/campaign-scoped totals, расширены API-тесты в `tests/usage.api.test.ts` кейсами успешного агрегирования и 404 для tenant/campaign scope.

- 16.08.2026: `T-054` переведена в `done`; добавлен endpoint `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` в `src/routes/usage.ts` с tenant isolation и возвратом `eventType`, `quantity`, `unit`, `occurredAt`; подключен в `src/server/app.ts`; добавлен `UsageLedgerItem` в `src/domain/usage-event/index.ts`; добавлен `tests/usage.api.test.ts`.

- 16.08.2026: `T-053` переведена в `done`; добавлен сервис автопаузы `CampaignAutoPauseService` в `src/domain/campaign-auto-pause/index.ts` с сохранением причины (`reasonCode`) и `auditLog` (`action: campaign.auto_paused`, `reasonCode`, `reasonText`, `source`, metadata), добавлены тесты `tests/campaign-auto-pause.test.ts` для корректной автопаузы running-кампании, проверки tenant isolation и обработки невалидного статуса.

- 16.08.2026: `T-052` переведена в `done`; добавлен `docs/operations/auto-pause.md` с reason codes автопаузы (`compliance_violation`, `complaint_spike`, `recording_failed`, `handoff_overloaded`, `provider_sla_failed`), описаны события-триггеры и чек-лист действий после автопаузы.

- 16.08.2026: `T-051` переведена в `done`; добавлен `GET /tenants/:tenantId/campaigns/:campaignId/scripts` в `src/routes/scripts.ts` для выдачи списка версий сценария (версия, статус, createdAt, createdByUserId), обеспечена сортировка по `version` и tenant isolation; обновлены `src/server/app.ts` (зависимости для list/create), расширен `tests/scripts.api.test.ts` кейсами списка версий и проверки изоляции.

- 16.08.2026: `T-050` переведена в `done`; добавлен `POST /tenants/:tenantId/campaigns/:campaignId/scripts` в `src/routes/scripts.ts` для создания версии сценария с автоинкрементом `version`, обновление статуса кампании в `review`; добавлен `src/server/app.ts` для регистрации маршрута и новых зависимостей; добавлен `tests/scripts.api.test.ts` с кейсами 1-го/последующего `version`, валидации и tenant isolation.

- 16.08.2026: `T-049` переведена в `done`; добавлен `PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa` в `src/routes/qa.ts`, подключен в `src/server/app.ts`, расширен `tests/calls/sandbox-call.api.test.ts` (успешный апдейт `qaStatus`, валидация, 404 сценарии) и обновлён статус задачи в бэклоге.

- 16.08.2026: Создан initial backlog из 60 задач по 1 SP на основе `ROADMAP_B2B_SAAS.md`.
- 16.08.2026: `T-001` переведена в `done` и backend stack закреплен в `docs/decisions/0001-backend-stack.md` (Node.js 20 + Fastify + Prisma + PostgreSQL + Vitest; команды локального запуска и тестов задокументированы).
- 16.08.2026: `T-002` переведена в `done`; создан `README.md` с описанием цели проекта, прототипов, статусом текущей backend-реализации, разделом локального запуска и ссылками на roadmap/backlog/decision doc.
- 16.08.2026: `T-003` переведена в `done`; создан минимальный backend-скелет по выбранному стеку (`package.json`, `tsconfig.json`, `src/server/app.ts`, `src/config/env.ts`), добавлены `healthcheck` (`/healthz`) и базовый `.env.example`.
- 16.08.2026: `T-004` переведена в `done`; настроен минимальный тестовый контур (`vitest`), добавлен smoke-тест `tests/healthcheck.test.ts` для `/healthz` и команда `npm run test`.
- 16.08.2026: `T-005` переведена в `done`; описана MVP Lab доменная модель в `docs/domain-model.md` (Tenant, User, Role, Campaign, DebtorRecord, CallAttempt, CallResult, ScriptVersion, ComplianceDecision, TelephonyConnection, UsageEvent) с ключевыми полями и связями.
- 16.08.2026: `T-006` переведена в `done`; в `docs/domain-model.md` добавлен Mermaid ERD с сущностями MVP Lab и ключевыми связями между tenant/user/campaign/debtor/call/decision/usage.
- 16.08.2026: `T-007` переведена в `done`; добавлены `src/db/prisma/schema.prisma` с моделью `Tenant` (id, name, status, createdAt, updatedAt) и миграция `src/db/migrations/0001_init_tenant/migration.sql`.
- 16.08.2026: `T-008` переведена в `done`; добавлены `User` и `Role` в `src/db/prisma/schema.prisma` с tenant-role связью и обязательным FK `tenantId`, добавлены миграция `src/db/migrations/0002_init_user_role/migration.sql`, доменные типы `src/domain/user/index.ts` и `src/domain/role/index.ts`.
- 16.08.2026: `T-009` переведена в `done`; добавлена модель `Campaign` в `src/db/prisma/schema.prisma` с enum-ограничениями статуса и связями `tenantId`/`createdByUserId`, добавлены миграция `src/db/migrations/0003_init_campaign/migration.sql` и тип `src/domain/campaign/index.ts`.
- 16.08.2026: `T-010` переведена в `done`; добавлены `DebtorRecord` и enums `DebtStatus`/`ConsentStatus` в `src/db/prisma/schema.prisma`, миграция `src/db/migrations/0004_init_debtor_record/migration.sql`, доменный тип `src/domain/debtor-record/index.ts`; добавлена уникальность `(tenantId, campaignId, externalId)`.
- 16.08.2026: `T-011` переведена в `done`; добавлена модель `ScriptVersion` в `src/db/prisma/schema.prisma` с enum `ScriptStatus`, связь `campaignId + version`, миграция `src/db/migrations/0005_init_script_version/migration.sql`, доменный тип `src/domain/script-version/index.ts`.
- 16.08.2026: `T-012` переведена в `done`; добавлены `ComplianceDecision` и enum `ComplianceDecisionStatus` в `src/db/prisma/schema.prisma`, миграция `src/db/migrations/0006_init_compliance_decision/migration.sql`, доменный тип `src/domain/compliance-decision/index.ts`; добавлены tenant/campaign/debtor связи.
- 16.08.2026: `T-013` переведена в `done`; добавлены `TelephonyConnection` и enums `TelephonyMode`/`TelephonyStatus` в `src/db/prisma/schema.prisma`, миграция `src/db/migrations/0007_init_telephony_connection/migration.sql`, доменный тип `src/domain/telephony-connection/index.ts`; секреты интеграций не хранятся в модели.
- 16.08.2026: `T-014` переведена в `done`; добавлены `CallAttempt` и `CallResult` и их enum-статусы в `src/db/prisma/schema.prisma`, создана миграция `src/db/migrations/0008_init_call_attempt_result/migration.sql`, добавлены доменные типы `src/domain/call-attempt/index.ts` и `src/domain/call-result/index.ts`.
- 16.08.2026: `T-015` переведена в `done`; добавлены `UsageEvent` и `UsageEventType` в `src/db/prisma/schema.prisma`, создана миграция `src/db/migrations/0009_init_usage_event/migration.sql`, добавлен доменный тип `src/domain/usage-event/index.ts`; добавлена уникальность `sourceId`.
- 16.08.2026: `T-016` переведена в `done`; добавлен endpoint `POST /campaigns` в `src/routes/campaigns.ts` (tenant-aware валидация, авто статус `draft`, связь через активного пользователя tenant), подключен в `src/server/app.ts`, добавлен тест `tests/campaigns.create.test.ts` и Prisma client файл `src/db/client.ts` для внедрения зависимости.
- 16.08.2026: `T-017` переведена в `done`; добавлен endpoint `GET /tenants/:tenantId/campaigns` в `src/routes/campaigns.ts` с tenant-scoped фильтрацией и сортировкой по `createdAt`, добавлен test-охват в `tests/campaigns.create.test.ts`; endpoint возвращает только поля `id`, `name`, `status`, `timezone`, `createdAt`.
- 16.08.2026: `T-018` переведена в `done`; добавлен endpoint `GET /tenants/:tenantId/campaigns/:campaignId` в `src/routes/campaigns.ts` для карточки кампании, добавлены агрегационные подсчёты по `DebtorRecord`, `CallAttempt`, `ComplianceDecision` и тесты в `tests/campaigns.create.test.ts` (в том числе 404 при отсутствии кампании/чужой tenant).
- 16.08.2026: `T-019` переведена в `done`; добавлен endpoint `PATCH /tenants/:tenantId/campaigns/:campaignId/status` в `src/routes/campaigns.ts` с проверкой tenant scope, whitelist-ом допустимых статусов и правилом валидных переходов, а также покрытие сценариями в `tests/campaigns.create.test.ts`.
- 16.08.2026: `T-020` переведена в `done`; добавлен контракт CSV импорта должников в `docs/data-contracts/debtor-import-csv.md` и валидный пример файла `fixtures/import/debtors-valid.csv` со всеми обязательными полями.
- 16.08.2026: `T-021` переведена в `done`; добавлен парсер CSV импорта в `src/import/debtor-import-parser.ts`, возвращающий массив сырых строк без доступа к БД и проверка пустого файла в `tests/import/debtor-import-parser.test.ts`.
- 16.08.2026: `T-022` переведена в `done`; добавлен валидатор `src/import/debtor-import-validator.ts` для проверки обязательных колонок и заполненности обязательных значений с отчетом ошибок по строкам, покрыт тестами в `tests/import/debtor-import-validator.test.ts`.
- 16.08.2026: `T-023` переведена в `done`; добавлен нормализатор телефона `src/import/phone-normalizer.ts` (удаление пробелов/скобок/дефисов, нормализация в E.164-похожий формат), невалидные номера теперь отправляются в ошибки импорта в `src/import/debtor-import-validator.ts`, добавлены тесты `tests/import/phone-normalizer.test.ts` и `tests/import/debtor-import-validator.test.ts`.
- 16.08.2026: `T-024` переведена в `done`; добавлена дедупликация строк импорта по `externalId` в `src/import/debtor-import-validator.ts` с отчетом об ошибке для повторных строк, добавлены тесты в `tests/import/debtor-import-validator.test.ts`.
- 16.08.2026: `T-025` переведена в `done`; добавлен API импорта должников в `POST /tenants/:tenantId/campaigns/:campaignId/debtors/import` в `src/routes/campaigns.ts` с использованием `parseDebtorImportCsv` + `validateDebtorImportRows`, сохранением валидных строк через `deps.debtorRecord.create`, tenant/campaign валидацией и возвращением quality report (`acceptedCount`, `rejectedCount`, `errors`) в `tests/import/debtors-import-api.test.ts`.
- 16.08.2026: `T-026` переведена в `done`; добавлен общий интерфейс compliance-правил в `src/compliance/rules/decision.ts` с контрактом `ComplianceRule`, а также тестовый fake rule `FakeAllowComplianceRule` в `src/compliance/rules/fake-allow.ts` и тест `tests/compliance/fake-allow.test.ts`.
- 16.08.2026: `T-027` переведена в `done`; добавлено правило `CallWindowComplianceRule` в `src/compliance/rules/call-window.ts` с дефолтным окном `08:00-22:00`, возвратом `allow`/`block` с reason code при блокировке и тестами в `tests/compliance/call-window.test.ts`.
- 16.08.2026: `T-028` переведена в `done`; добавлено правило `ConsentStatusRule` в `src/compliance/rules/consent-status.ts`, блокирующее `consentStatus=revoked` с reason code `CONSENT_REVOKED`, и тест `tests/compliance/consent-status.test.ts`.
- 16.08.2026: `T-029` переведена в `done`; добавлено правило `DebtStatusRule` в `src/compliance/rules/debt-status.ts`, блокирующее `closed`, `disputed`, `bankruptcy`, `contact_forbidden` с reason code `DEBT_STATUS_BLOCK`, и тест `tests/compliance/debt-status.test.ts`.
- 16.08.2026: `T-030` переведена в `done`; добавлен `ComplianceEngine` в `src/compliance/engine/compliance-engine.ts`, который выполняет список правил, возвращает итоговое решение allow/block и список всех сработавших blocking-правил; добавлены тесты `tests/compliance/engine.test.ts`.
- 16.08.2026: `T-031` переведена в `done`; `ComplianceEngine` расширен записью compliance decision log в `src/compliance/engine/compliance-engine.ts` (с полями `decision`, `reasonCode`, `reasonText`, `ruleVersion`, `checkedAt`), добавлены тесты логирования в `tests/compliance/engine.test.ts`.
- 16.08.2026: `T-032` переведена в `done`; добавлен endpoint проверки compliance для debtor record `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check` в `src/routes/compliance.ts`, подключен в `src/server/app.ts` и покрыт тестом `tests/compliance/api-check.test.ts` с проверкой сохранения записи `ComplianceDecision`.
- 16.08.2026: `T-033` переведена в `done`; добавлен vendor-agnostic интерфейс voice provider adapter (`src/telephony/voice-provider/adapter.ts`, экспорт в `src/telephony/voice-provider/index.ts`) с контрактами методов `startCall`/`getCallStatus`/`hangupCall` и статусами звонков, добавлена документация в `docs/integrations/voice-provider-adapter.md`, добавлен базовый контрактный тест `tests/telephony/voice-provider.test.ts`.
- 16.08.2026: `T-034` переведена в `done`; реализован sandbox provider в `src/telephony/sandbox-provider/index.ts` с детерминированным `providerCallId`, предсказуемой эволюцией статусов через `getCallStatus` и `hangupCall`, добавлены тесты `tests/telephony/sandbox-provider.test.ts`.
- 16.08.2026: `T-035` переведена в `done`; реализован `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox` в `src/routes/calls.ts` с обязательной проверкой tenant/campaign/debtor scope, запуском `ComplianceEngine` до старта провайдера и созданием `CallAttempt` только при `allow`; добавлены/обновлены проверки в `tests/calls/sandbox-call.api.test.ts`.
- 16.08.2026: `T-036` переведена в `done`; расширен `src/routes/calls.ts` для создания `CallResult` после sandbox-звонка с заполнением `outcome`, `reason`, `transcriptUrl`, `recordingUrl` и добавлено покрытие в `tests/calls/sandbox-call.api.test.ts`.
- 16.08.2026: `T-037` переведена в `done`; добавлено создание `UsageEvent` в `src/routes/calls.ts` для sandbox звонка (`call_started`, `call_completed` для terminal статуса), с привязкой к `tenantId/campaignId`, `sourceId` и тестами в `tests/calls/sandbox-call.api.test.ts`.
- 16.08.2026: `T-038` переведена в `done`; добавлен сервис `createCampaignReport` в `src/reports/campaign-report.ts` (tenant/campaign-scoped агрегации `totalRecords`, `attemptedCalls`, `completedCalls`, `blockedCalls`, `ptpCount`) и тесты в `tests/reports/campaign-report.test.ts`.
- 16.08.2026: `T-039` переведена в `done`; добавлен endpoint `GET /tenants/:tenantId/campaigns/:campaignId/report` в `src/routes/reports.ts`, подключен в `src/server/app.ts` через зависимость `CampaignStoreWithReportRouteDeps`, добавлен API-тест в `tests/reports/campaign-report.api.test.ts` и подтверждено использование `createCampaignReport` для tenant/campaign-scoped метрик.
- 16.08.2026: `T-040` переведена в `done`; обновлён `prototype.html`: удалён блок с демо-данными отчёта, добавлен fetch к `GET /tenants/:tenantId/campaigns/:campaignId/report` и fallback при недоступности API, а также вывод долей по исходам.
- 16.08.2026: `T-041` переведена в `done`; добавлен `docs/security/rbac.md` с ролями `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin` и минимальной матрицей прав в формате роль→действие для MVP.
- 16.08.2026: `T-042` переведена в `done`; добавлен `src/server/middleware/tenant-context.ts` для извлечения tenant из `X-Tenant-Id`/`:tenantId`/`body.tenantId`, подключён как `preValidation` hook в `src/server/app.ts`, маршрут `POST /campaigns` теперь использует `request.tenantContext`, и в `tests/campaigns.create.test.ts` добавлен тест приоритета заголовка `X-Tenant-Id` и сценарий ошибки при отсутствии tenant context.
- 16.08.2026: `T-043` переведена в `doing` для внедрения простого RBAC middleware (`X-User-Role`) и проверки write endpoint.
- 16.08.2026: `T-043` переведена в `done`; добавлен `src/server/middleware/rbac.ts` с ролью доступа на основе `X-User-Role`, middleware подключён к `POST /campaigns` для защиты создания кампаний (разрешены `owner`, `collection_manager`), и в `tests/campaigns.create.test.ts` добавлены проверки `USER_ROLE_MISSING` и `FORBIDDEN`.
- 16.08.2026: `T-044` переведена в `doing` для добавления `AuditLog` как tenant-scoped аудита.
- 16.08.2026: `T-044` переведена в `done`; добавлены `src/db/prisma/schema.prisma` и миграция `src/db/migrations/0010_init_audit_log/migration.sql` для `AuditLog` (`id`, `tenantId`, `userId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`), добавлен доменный тип `src/domain/audit-log/index.ts` и тест `tests/domain-audit-log.test.ts`.
- 16.08.2026: `T-045` переведена в `doing` для добавления audit события на создание кампании.
- 16.08.2026: `T-045` переведена в `done`; в `POST /campaigns` (`src/routes/campaigns.ts`) добавлено создание `AuditLog` с действием `campaign.created`, пользователем, tenant, `entityType` и `entityId`; обновлён тип `CampaignDependencies` в `src/server/app.ts`; в `tests/campaigns.create.test.ts` добавлена проверка, что `auditLog.create` вызывается с корректными полями.
- 16.08.2026: `T-046` переведена в `doing` для реализации списка звонков кампании (tenant-scoped) через `src/routes/calls.ts`; добавлен путь `GET /tenants/:tenantId/campaigns/:campaignId/calls`, расширены зависимости в `src/server/app.ts`, добавлен API-тест в `tests/calls/sandbox-call.api.test.ts`; `T-046` переведена в `done`.
- 16.08.2026: `T-047` переведена в `doing` для реализации карточки звонка; добавлен endpoint `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId` в `src/routes/calls.ts` с проверкой tenant isolation и возвратом `attempt`, `result`, `complianceDecisions`, `usageEvents`; расширены зависимости `callAttempt.findUnique` в `src/server/app.ts` и `src/routes/calls.ts`; добавлены/обновлены API-тесты в `tests/calls/sandbox-call.api.test.ts`; `T-047` переведена в `done`.
- 16.08.2026: `T-048` переведена в `doing`; добавлено `qaStatus` в домен `CallResult` (`src/domain/call-result/index.ts`, enum `CallResultQaStatus` и `isCallResultQaStatus`), расширена Prisma-схема и миграция (`src/db/prisma/schema.prisma`, `src/db/migrations/0011_add_qa_status_to_call_result/migration.sql`), в `POST /calls/sandbox` (`src/routes/calls.ts`) добавлено присвоение `qaStatus: not_reviewed` с валидацией через `isCallResultQaStatus`; добавлен `tests/domain-call-result.test.ts` и обновлены проверки создания `callResult` в `tests/calls/sandbox-call.api.test.ts`; `T-048` переведена в `done`.
