# AI Collector (MVP Lab)

AI Collector — это прототип продукта для compliance-first обзвона и работы с коллекшн-кампаниями B2B (MVP Lab).
Цель текущей итерации — превратить статический прототип в управляемую backend-first платформу с моделью данных, API, compliance, импортом базы, журналом решений и отчетностью из реальных событий.

## Текущее состояние репозитория

- `index.html` — продуктовый dashboard прототипа (архитектура, сценарии, риски, расчет экономики).
- `prototype.html` — кликабельный кабинет пользователя (кампании, источники, сценарии, звонки, отчеты).
- `ROADMAP_B2B_SAAS.md` — продуктовый roadmap и стратегический план развития.
- `TECH_BACKLOG_1SP.md` — технический backlog по задачам 1 SP для поэтапной реализации.
- `docs/decisions/0001-backend-stack.md` — зафиксированное решение по backend стэку.

## Как работать в репозитории сейчас

Проект находится на раннем этапе реализации после этапа принятия архитектурных решений:

- backend stack выбран: Node.js 20 + TypeScript + Fastify + Prisma + PostgreSQL + Vitest
- физический backend-код пока только формируется в следующих итерациях
- текущая задача после `T-001` — создание полноценного `README` для локальной разработки

## Локальный запуск (текущий)

1. Клонируйте репозиторий.
2. Откройте `index.html` или `prototype.html` в браузере для просмотра текущих прототипов.
3. При запуске backend-части, согласно решению (`docs/decisions/0001-backend-stack.md`), ожидаемый локальный порядок будет:
   - `cp .env.example .env`
   - `docker compose up -d`
   - `npm install`
   - `npm run db:migrate`
   - `npm run db:seed`
   - `npm run dev`

> Примечание: в этой итерации backend файлы проекта только начинают формироваться по backlog-задачам.

## Рекомендуемый рабочий цикл на итерации

- Берем одну задачу `1 SP` из `TECH_BACKLOG_1SP.md`.
- Меняем статус на `doing`.
- Реализуем только одну задачу.
- Обновляем `TECH_BACKLOG_1SP.md` с итогом (`done`/`blocked`/`split`) и добавляем запись в журнал изменений.
- Переходим к следующей задаче.

## Ключевые ссылки

- [Roadmap B2B SaaS](./ROADMAP_B2B_SAAS.md)
- [Technical Backlog 1 SP](./TECH_BACKLOG_1SP.md)
- [Backend stack decision](./docs/decisions/0001-backend-stack.md)

## API документация MVP (route-level)

- [Telephony API](./docs/telephony-api.md)
- [Calls API](./docs/calls-api.md)

Эти документы содержат контрактные описания MVP endpoints для запуска, мониторинга и управления вызовами:

- `GET/POST /tenants/:tenantId/telephony-connections`
- `POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox`
- `GET /tenants/:tenantId/campaigns/:campaignId/calls`
- `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId`
