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

## Журнал изменений плана

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

## Журнал изменений плана

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
