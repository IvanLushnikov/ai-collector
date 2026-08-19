# AI Collector (MVP Lab)

## Публичный сайт

Публичный лендинг пилота публикуется через GitHub Pages из папки `public/`.

Сайт: https://ivanlushnikov.github.io/ai-collector/

Форма заявки не содержит секретов: браузер отправляет данные на Cloudflare Worker (`lead-relay`), который делает `repository_dispatch` в приватный репозиторий `IvanLushnikov/ai-collector-back`. Telegram-токены живут только в секретах приватного репозитория.

Инструкция по настройке: [docs/operations/github-pages-setup.md](./docs/operations/github-pages-setup.md)

AI Collector — это прототип продукта для compliance-first обзвона и работы с коллекшн-кампаниями B2B (MVP Lab).
Цель текущей итерации — превратить статический прототип в управляемую backend-first платформу с моделью данных, API, compliance, импортом базы, журналом решений и отчетностью из реальных событий.

## Текущее состояние репозитория

- `index.html` — продуктовый dashboard прототипа (архитектура, сценарии, риски, расчет экономики).
- `prototype.html` — кликабельный кабинет пользователя (кампании, источники, сценарии, звонки, отчеты).
- `ROADMAP_B2B_SAAS.md` — продуктовый roadmap и стратегический план развития.
- `TECH_BACKLOG_1SP.md` — единственная очередь задач 1 SP (backend и кабинет).
- `DESIGN_BACKLOG_1SP.md` — архив закрытых UX-волн `D-001`–`D-013`.
- `docs/decisions/0001-backend-stack.md` — зафиксированное решение по backend стэку.

## Как работать в репозитории сейчас

Проект находится на раннем этапе реализации после этапа принятия архитектурных решений:

- backend stack выбран: Node.js 20 + TypeScript + Fastify + Prisma + PostgreSQL + Vitest
- физический backend-код пока только формируется в следующих итерациях
- текущая задача после `T-001` — создание полноценного `README` для локальной разработки

## Agent bootstrap и обязательные skills

В репозитории закреплен `skill-first` режим работы агента:

- корневой bootstrap живет в `AGENTS.md`
- дополнительный bootstrap для Claude/Codex-потока живет в `CLAUDE.md`
- базовое правило маршрутизации начинается с `skills/using-superpowers/SKILL.md`

Что это значит на практике:

- перед разработкой, доработкой, проектированием, UX/UI-работой или написанием требований агент обязан сначала выбрать и прочитать релевантный skill
- для AI Collector product/UI/UX задач первым должен идти `skills/ru-ai-collector-product-design/SKILL.md`
- для пользовательского русского текста после продуктового design skill должен применяться `skills/russian-product-copy/SKILL.md`
- для feature work, plan/design, debugging, review и verification используются маршруты из `AGENTS.md`

Проверка bootstrap не оставлена на память модели:

- `npm run verify:skills` валидирует наличие bootstrap-файлов и всех обязательных `SKILL.md`
- `npm run test` и `npm run typecheck` сначала запускают `verify:skills`, а потом уже основной контур
- CI (GitHub Actions): [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) на `pull_request` и `push` в `main`/`master` запускает `npm ci`, `npm run typecheck`, `npm run test`. Секреты в workflow не используются; тесты не требуют PostgreSQL service.

Если `verify:skills` падает, значит skill-маршрутизация репозитория нарушена и это нужно починить до дальнейшей работы.

## Локальный запуск (текущий)

1. Клонируйте репозиторий.
2. Откройте `index.html` или `prototype.html` в браузере для просмотра текущих прототипов.
3. Backend:
   - `cp .env.example .env`
   - `docker compose up -d` — PostgreSQL 16 (`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_collector`) и Redis (`REDIS_URL=redis://127.0.0.1:6379`), без секретов в git
   - `npm install`
   - `npm run dev`
   - тесты: `npm run test` (без живого Postgres/Redis)

## Рекомендуемый рабочий цикл на итерации

- Берем одну задачу `1 SP` из `TECH_BACKLOG_1SP.md`.
- Меняем статус на `doing`.
- Реализуем только одну задачу.
- Обновляем `TECH_BACKLOG_1SP.md` с итогом (`done`/`blocked`/`split`) и добавляем запись в журнал изменений.
- Переходим к следующей задаче.

## Ключевые ссылки

- [Roadmap B2B SaaS](./ROADMAP_B2B_SAAS.md)
- [Technical Backlog 1 SP](./TECH_BACKLOG_1SP.md)
- [CI](./.github/workflows/ci.yml)
- [Design Backlog 1 SP](./DESIGN_BACKLOG_1SP.md) (архив UX, не очередь)
- [Backend stack decision](./docs/decisions/0001-backend-stack.md)
- [PRD](./docs/product/prd-draft.md)
- [Карта технологических решений](./docs/architecture/2026-08-17-technology-map.md)
- [Compliance rulebook v1](./docs/compliance/rulebook-v1.md)
- [Live voice provider](./docs/decisions/0003-live-voice-provider.md)
- [Speech/LLM stack](./docs/decisions/0004-speech-llm-stack.md)
- [BYOK ASR/TTS/LLM](./docs/decisions/0005-byok-speech-llm.md)
- [Codex Spark Design Goal](./CODEX_SPARK_DESIGN_GOAL.md)

## API документация MVP (route-level)

- [Telephony API](./docs/telephony-api.md)
- [Provider Credentials API](./docs/provider-credentials-api.md)
- [Calls API](./docs/calls-api.md)
- [Campaigns API](./docs/campaigns-api.md)
- [Compliance API](./docs/compliance-api.md)
- [Audit Logs API](./docs/audit-logs-api.md)
- [Usage API](./docs/usage-api.md)
- [Campaign Report API](./docs/reports-api.md)
- [Campaign Readiness API](./docs/campaign-readiness-api.md)
- [Tenant Billing API](./docs/tenant-billing-api.md)
- [Review Items API](./docs/review-items-api.md)

Примечание по параметрам аудита:

- Для `GET /tenants/:tenantId/audit-logs` и `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs` параметры пагинации: `limit` принимает значения от `1` до `100` (по умолчанию `20`), `offset` — от `0` до `1000`.
- Для `GET /tenants/:tenantId/campaigns` параметры пагинации такие же: `limit` от `1` до `100` (по умолчанию `20`), `offset` — от `0` до `1000`.
- Для `GET /tenants/:tenantId/campaigns/:campaignId/calls` параметры пагинации аналогичны: `limit` от `1` до `100` (по умолчанию `20`), `offset` — от `0` до `1000`.
- Дополнительно для `GET /tenants/:tenantId/campaigns/:campaignId/calls` доступны query-параметры фильтрации: `outcome` (`not_called`, `no_answer`, `callback_requested`, `wrong_number`, `ptp_created`, `handoff`, `dispute`, `blocked`, `error`) и `qaStatus` (`not_reviewed`, `approved`, `flagged`).
- Для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events` параметры пагинации также такие же: `limit` от `1` до `100` (по умолчанию `20`), `offset` — от `0` до `1000`.
- Для `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals` пагинации нет: endpoint возвращает агрегированные метрики по `eventType/unit` в формате массива: `[ { eventType, unit, totalQuantity } ]`.
- Для RBAC SaaS v1 backend использует канонические роли `tenant_owner`, `campaign_manager`, `tenant_viewer`, `platform_admin`, `support_engineer`.
- Header-based `X-User-Role` сохранён как dev/test fallback и нормализует legacy значения `owner`, `collection_manager`, `operator`, `qa_analyst`, `compliance_officer`, `integration_admin`.
- Для большинства tenant-scoped endpoint-ов доступ проверяется через единый zone-based authorizer (`campaigns`, `calls`, `reports`, `integrations`, `users`, `audit_logs`).
- `support_engineer` не получает tenant-доступ автоматически: нужен явный `SupportAccessGrant`.

Эти документы содержат контрактные описания MVP endpoints для запуска, мониторинга и управления вызовами:

- `GET/POST /tenants/:tenantId/telephony-connections`
- `GET /tenants/:tenantId/campaigns`
- `GET /tenants/:tenantId/campaigns/:campaignId`
- `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`
- `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check`
- `GET /tenants/:tenantId/campaigns/:campaignId/compliance-decisions`
- `GET /tenants/:tenantId/campaigns/:campaignId/calls`
- `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`
- `PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa`
- `GET /tenants/:tenantId/campaigns/:campaignId/audit-logs`
- `GET /tenants/:tenantId/audit-logs`
- `GET /tenants/:tenantId/campaigns/:campaignId/usage-events`
- `GET /tenants/:tenantId/campaigns/:campaignId/usage-events/totals`
- `GET /tenants/:tenantId/campaigns/:campaignId/report`
- `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`
- `GET /tenants/:tenantId/campaigns`
- `GET /tenants/:tenantId/campaigns/:campaignId`
- `PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve`
- `PATCH /tenants/:tenantId/campaigns/:campaignId/status`
- `GET /tenants/:tenantId/billing/settings`
- `PATCH /tenants/:tenantId/billing/settings`
