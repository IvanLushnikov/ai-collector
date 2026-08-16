# Technical Backlog: 1 SP Tasks

Дата: 16.08.2026

Этот backlog разбивает roadmap AI-коллектора на маленькие технологические задачи уровня 1 story point. Каждая задача должна быть достаточно узкой, чтобы Codex Spark 5.3 мог выполнить ее за один проход: прочитать контекст, внести изменения, проверить результат и обновить этот файл.

## Правила работы с backlog

- Каждая задача = 1 story point.
- За один проход брать только одну задачу со статусом `todo`.
- После реализации менять статус задачи на `done`.
- Если во время реализации появился новый технический шаг, добавить его как новую задачу со статусом `todo`.
- Если задача оказалась слишком крупной, не делать ее целиком: разбить на несколько задач по 1 SP и оставить исходную как `split`.
- После каждой реализации обновлять раздел `Журнал изменений плана`.
- Если структура проекта изменилась, обновлять поля `Где менять` у затронутых будущих задач.

## Статусы

- `todo` - задача готова к реализации.
- `doing` - задача взята в работу.
- `done` - задача реализована и проверена.
- `blocked` - задача заблокирована внешним решением или доступом.
- `split` - задача разбита на более мелкие задачи.

## Предположения на старт

- Сейчас проект состоит из `index.html`, `prototype.html` и `ROADMAP_B2B_SAAS.md`.
- Backend, БД и тестовый контур еще не созданы.
- Первый технический инкремент должен перейти от статического прототипа к минимальному рабочему MVP Lab: доменная модель, API, импорт базы, compliance decision log, sandbox voice provider и отчеты из событий.
- До выбора стека задачи на backend указывают ожидаемые пути. После выбора стека эти пути нужно уточнить.

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

Статус: `todo`

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

Статус: `todo`

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

Статус: `todo`

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

Статус: `todo`

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

Статус: `todo`

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

Статус: `todo`

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

Статус: `todo`

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

Статус: `todo`

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

## Журнал изменений плана

- 16.08.2026: `T-066` переведена в `done`; добавлен раздел "API документация MVP (route-level)" в `README.md` с ссылками на `docs/telephony-api.md` и `docs/calls-api.md`.

- 16.08.2026: Добавлен блок UX/design задач `T-065`-`T-072` для закрытия разрыва между backend-ready MVP Lab и пользовательским операторским контуром; roadmap дополнен качественной оценкой завершённости по этапам.

- 16.08.2026: `T-065` переведена в `done`; добавлен `docs/calls-api.md` с route-level описаниями `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`,
  `GET /tenants/:tenantId/campaigns/:campaignId/calls` и `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`, включая коды ответов,
  структуры payload/response и требования tenant isolation + compliance gate для стартов.

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
