# Лендинг и web-auth для клиентского кабинета

Дата: 19.08.2026  
Статус: утверждена в чате; требуется письменное ревью перед планом и реализацией  
Поверхность: публичные статические страницы (`landing.html`, `register.html`, `login.html`, `privacy.html`, `terms.html`), backend auth API, `prototype.html`, `scripts/dev-gateway.mjs`.

Главный принцип продукта не меняется: автоматизировать только то, что система может безопасно выполнить, объяснить и доказать. Эта спецификация добавляет вход в продукт и не меняет существующие business endpoints сверх интеграции с auth-контекстом. Header-based режим для разработки сохраняется как fallback.

## 1. Зачем

Сейчас корень dev-gateway открывает сразу `prototype.html`, а доступ к API держится на заголовках `X-Tenant-Id` и `X-User-Role`. Для веб-сценария это неудобно и небезопасно: у пользователя нет нормального входа, регистрации и выхода, а `prototype.html` зависит от хардкода tenant и роли.

Нужно добавить минимальный публичный входной контур:

- лендинг с понятным CTA на регистрацию;
- русскоязычные формы регистрации и входа;
- backend-аутентификацию по email и паролю;
- установку auth-контекста через cookie;
- автоматический вход в существующий кабинет без переписывания всего `prototype.html`.

## 2. Scope и ограничения

Входит:

- новые статические страницы в корне репозитория;
- проксирование `/auth/*` через dev-gateway;
- backend endpoints `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`;
- хранение `User.passwordHash`;
- server-side session через cookie;
- middleware, которое заполняет `tenantContext` и `userRole` из auth-сессии;
- обновление `prototype.html`, чтобы tenant/role больше не были хардкодом;
- тесты auth API и, по возможности, auth middleware.

Не входит:

- SSO/OIDC из ADR `0002`;
- отдельный SPA/frontend build pipeline;
- роли и онбординг сложнее, чем owner при саморегистрации;
- смена пароля, восстановление пароля, подтверждение email;
- массовый рефактор всех existing routes на новый auth-only контракт.

Инварианты:

1. Существующие endpoints не ломаются.
2. Header-based режим разработки остаётся рабочим.
3. Если request уже получил auth-контекст, `tenantContextMiddleware` и `roleMiddleware` не требуют заголовки.
4. `prototype.html` после входа использует реальные `tenantId` и `role`, а не строковые константы.

## 3. Пользователь и сценарий

Целевой пользователь этого контура: менеджер кампаний или владелец аккаунта клиента, который впервые попадает в ИИ-коллектор через браузер.

Основной путь:

**Открыть `/` → прочитать лендинг → перейти в регистрацию → создать организацию и пользователя-owner → автоматически попасть в `prototype.html` → создать кампанию уже с корректным auth-контекстом.**

Второй путь:

**Открыть `/login.html` → войти по email/паролю → автоматически попасть в `prototype.html`.**

Выход:

**Нажать «Выйти» в кабинете → cookie очищена → следующий защищённый вход ведёт на `/login.html`.**

## 4. UX и тексты

Тон: спокойный, рабочий, без маркетингового восторга. Пользователь видит, что это рабочий инструмент для тестового контура взыскания, а не промо-сайт «волшебного ИИ».

### 4.1. Лендинг

Лендинг отвечает на три вопроса:

1. Что это за продукт.
2. Для кого он нужен.
3. Как начать работу.

Секции:

- краткий hero-блок с CTA `Создать аккаунт`;
- 3–4 факта о процессе: кампании, база, телефония, журнал действий;
- секция `Как начать`;
- короткий FAQ или ответы на частые вопросы прямо на лендинге;
- ссылки на `Политику конфиденциальности` и `Условия использования`.

Запрещено:

- обещать production-ready автономное взыскание;
- обещать юридические гарантии, которых нет в проектной документации;
- использовать hype-копирайтинг.

### 4.2. Формы входа и регистрации

Формы должны:

- быть русскоязычными;
- показывать валидацию рядом с полем;
- не терять введённые данные после server-side ошибки;
- иметь понятную итоговую ошибку под формой;
- иметь явные ссылки между входом и регистрацией.

Регистрация:

- `Название организации`
- `Имя`
- `Email`
- `Пароль`
- чекбокс согласия с условиями

Вход:

- `Email`
- `Пароль`

Примеры ошибок:

- `Укажите email.`
- `Введите пароль не короче 8 символов.`
- `Пользователь с таким email уже зарегистрирован.`
- `Не удалось войти. Проверьте email и пароль.`

## 5. Архитектурный подход

Рекомендуемый подход: **cookie-based session + сохранение текущего header-based fallback**.

Почему:

- совместим с текущим Fastify + статический HTML стеком;
- не требует переписывать existing routes;
- даёт нормальный браузерный вход;
- позволяет использовать auth-контекст в middleware, но не ломать тесты и dev-запросы на заголовках.

Не использовать:

- localStorage как источник аутентификации;
- frontend-only хранение tenant/role без проверки на backend;
- silent fallback с auth-cookie на чужой platform identity.

## 6. Модель данных

### 6.1. `User.passwordHash`

В модель `User` добавляется nullable-поле:

- `passwordHash String?`

Причина nullable: не мешает будущему SSO и не ломает существующие тестовые фикстуры, где пользователь мог создаваться без пароля.

Пароль хранится только в hash-виде. Алгоритм: `argon2`.

### 6.2. `Session`

Новая таблица сессий:

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID PK | идентификатор сессии |
| `tokenHash` | string unique | hash сырого токена из cookie |
| `userId` | UUID FK | пользователь |
| `tenantId` | UUID FK | организация |
| `roleName` | string | снимок роли для RBAC |
| `expiresAt` | timestamp | срок жизни сессии |
| `revokedAt` | timestamp nullable | logout / отзыв |
| `createdAt` | timestamp | дата создания |
| `updatedAt` | timestamp | дата обновления |

Правила:

1. В cookie хранится только сырой session token.
2. В БД хранится только hash токена.
3. `logout` помечает сессию отозванной и очищает cookie.
4. Просроченная или отозванная сессия не восстанавливает контекст.

## 7. Backend API

Новый файл: `src/routes/auth.ts`.

### 7.1. `POST /auth/register`

Принимает:

```json
{
  "organizationName": "ООО МКК ФинЛиния",
  "name": "Анна Котова",
  "email": "anna@example.com",
  "password": "strong-password"
}
```

Поведение:

1. Валидирует поля.
2. Проверяет, что email ещё не зарегистрирован.
3. Создаёт `Tenant`.
4. Создаёт или находит роль `owner` для tenant.
5. Создаёт `User` с `passwordHash`.
6. Создаёт `Session`.
7. Ставит auth-cookie.
8. Возвращает безопасный payload без `passwordHash` и без session token.

Ошибки:

- `400 VALIDATION_ERROR`
- `409 EMAIL_ALREADY_EXISTS`

### 7.2. `POST /auth/login`

Принимает:

```json
{
  "email": "anna@example.com",
  "password": "strong-password"
}
```

Поведение:

1. Находит активного пользователя по email.
2. Проверяет наличие `passwordHash`.
3. Сверяет пароль через `argon2.verify`.
4. Создаёт новую `Session`.
5. Ставит auth-cookie.
6. Возвращает безопасный payload пользователя, tenant и роли.

Ошибки:

- `400 VALIDATION_ERROR`
- `401 INVALID_CREDENTIALS`

Возвращать раздельные ошибки «email не найден» и «пароль неверный» не нужно.

### 7.3. `POST /auth/logout`

Поведение:

1. По текущей cookie находит сессию.
2. Если сессия есть, помечает `revokedAt`.
3. Очищает cookie всегда.
4. Возвращает `204`.

### 7.4. `GET /auth/me`

Поведение:

- если cookie валидна, вернуть:

```json
{
  "authenticated": true,
  "user": {
    "id": "user-id",
    "name": "Анна Котова",
    "email": "anna@example.com"
  },
  "tenant": {
    "id": "tenant-id",
    "name": "ООО МКК ФинЛиния"
  },
  "role": "owner"
}
```

- если cookie нет или она невалидна, вернуть:

```json
{
  "authenticated": false
}
```

Для `GET /auth/me` не нужен header-based fallback: это endpoint о браузерной сессии.

## 8. Middleware и совместимость

### 8.1. `authContextMiddleware`

Новый middleware:

- читает cookie;
- проверяет session token;
- находит session и пользователя;
- выставляет:
  - `request.authContext`
  - `request.tenantContext`
  - `request.userRole`

Структура:

```ts
type RequestAuthContext = {
  userId: string;
  tenantId: string;
  role: string;
  sessionId: string;
};
```

`tenantContext.source` расширяется значением `'auth'`.

### 8.2. Обновление tenant-context

`tenantContextMiddleware` работает так:

1. если `request.tenantContext` уже установлен auth middleware, ничего не требует;
2. иначе использует старую логику:
   - `X-Tenant-Id`
   - `:tenantId`
   - `body.tenantId`
3. если ничего нет, возвращает `TENANT_CONTEXT_MISSING`.

### 8.3. Обновление RBAC

`roleMiddleware` работает так:

1. если `request.userRole` уже установлен, проверяет его на `allowedRoles`;
2. иначе использует текущий `X-User-Role` header;
3. если роли нет, возвращает `USER_ROLE_MISSING`.

Итог: browser auth и dev/header-mode существуют одновременно.

## 9. Интеграция с `prototype.html`

`prototype.html` остаётся существующим кабинетом, но перестаёт быть точкой анонимного входа.

Новая логика:

1. При загрузке страницы выполняется `GET /auth/me`.
2. Если `authenticated=false`, происходит redirect на `/login.html`.
3. Если пользователь авторизован:
   - в runtime-состояние записываются `tenantId`, `role`, `userName`, `tenantName`;
   - `workspace.dataset.tenantId` заполняется реальным tenant id для совместимости со старым кодом;
   - UI в шапке и боковой панели показывает текущего пользователя и организацию;
   - кнопка `Выйти` вызывает `POST /auth/logout`, затем redirect на `/login.html`.

Все запросы `prototype.html`, где сегодня захардкожены:

- `workspace.dataset.tenantId`
- `'X-User-Role': 'owner'`

должны использовать runtime auth context.

Минимальный сценарий, который обязан работать после изменений:

- открыть кабинет после входа;
- создать кампанию;
- отправить `POST /campaigns` с корректными `X-Tenant-Id` и `X-User-Role`;
- не сломать уже работающие чтения кампаний, отчётов, звонков, readiness и audit.

## 10. Dev gateway

В `scripts/dev-gateway.mjs`:

1. `/` редиректит на `/landing.html`;
2. проксируются `/auth/*`;
3. existing API prefixes сохраняются;
4. HTML по-прежнему получает `window.AI_COLLECTOR_API_URL = window.location.origin`.

Если `prototype.html` для минимального сценария требует дополнительные backend endpoints, их проксирование добавляется без изменения контракта endpoint-ов.

## 11. Тестовая стратегия

Только через TDD: сначала failing tests, потом минимальная реализация.

Минимум:

1. `POST /auth/register`:
   - успешная регистрация;
   - повторная регистрация email.
2. `POST /auth/login`:
   - успешный вход;
   - неверный пароль.

Желательно:

3. `authContextMiddleware`:
   - валидная cookie выставляет `tenantContext` и `userRole`;
   - отсутствие cookie не ломает header-based fallback.
4. Интеграционный тест:
   - защищённый endpoint, например `POST /campaigns`, проходит без заголовков при валидной auth-cookie.
5. `prototype.html`:
   - больше не содержит хардкод tenant/owner в create/import happy path;
   - делает запрос `/auth/me` на старте.

## 12. Риски и защитные решения

### 12.1. Не сломать existing tests

Риск: текущие тесты route-ов опираются на header-based доступ.

Решение: auth middleware только обогащает request; отсутствие cookie не должно менять текущее поведение.

### 12.2. Не сломать tenant isolation

Риск: `prototype.html` или middleware может смешать tenant из cookie и из body/header.

Решение: если auth-контекст уже установлен, он приоритетнее body/header. Клиентские заголовки в браузерном режиме должны совпадать с auth-контекстом и не становиться источником истины.

### 12.3. Не протечь в UI внутренними терминами

Риск: пользователь увидит технические ошибки вроде `INVALID_CREDENTIALS` или `TENANT_CONTEXT_MISSING`.

Решение: API может вернуть machine-readable code, но страницы входа и лендинг показывают спокойные русские сообщения с понятным следующим шагом.

## 13. Критерии готовности

Считается готовым, когда:

1. `/` открывает `landing.html`.
2. CTA с лендинга ведёт на регистрацию.
3. После успешной регистрации пользователь попадает в `prototype.html`.
4. После успешного входа пользователь попадает в `prototype.html`.
5. `prototype.html` берёт tenant/role из auth-сценария, а не из хардкода.
6. Создание кампании из кабинета идёт с корректными `X-Tenant-Id` и `X-User-Role`.
7. Existing header-based режим для разработки всё ещё работает.
8. Есть automated tests минимум на регистрацию и вход.
