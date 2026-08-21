# Decision: Backend stack for MVP Lab

## Решение

- Backend runtime: **Node.js 20 + TypeScript**.
- Web framework: **Fastify**.
- API style: JSON REST API (versioned, tenant-scoped from the first iteration).
- ORM/DB toolkit: **Prisma**.
- Database: **PostgreSQL 16**.
- Validation: **Zod** for request schemas and env validation.
- Background/scheduler: **BullMQ + Redis** (platform dependency; MVP/Pilot may use in-process helpers + transactional Outbox for side effects — see `docs/architecture/2026-08-21-async-sot.md`).
- Telephony/AI integrations: сначала через adapter interfaces, потом sandbox и один реальный провайдер.
- API testing: **Vitest** (unit + integration через `app.inject` Fastify; отдельный Supertest в deps **не** используется).
- Lint/type: **ESLint** + **TypeScript strict mode**. Prettier в репозитории **не** подключён (не считать обязательным tooling SoT).

## Почему этот стек подходит для MVP Lab

1. **Скорость запуска** — Fastify + TypeScript дают быстрый REST API и прозрачную типизацию.
2. **Масштабируемость на этапе роста** — Prisma + PostgreSQL хорошо подходят для tenant-based модели и последующего расширения в SaaS.
3. **Надежный test-first контроль** — Vitest + Fastify inject позволяют быстро наращивать coverage для compliance и API-ограничений.
4. **Простота эксплуатации** — Node/PostgreSQL/Docker хорошо поддерживаются в локальном и облачном запуске.
5. **Совместимость с продуктовым порядком** — позволяет параллельно внедрять compliance engine, domain entities, sandbox провайдер и usage ledger.

## Команды локального запуска (после инициализации проекта)

- `cp .env.example .env`
- `docker compose up -d`
- `npm install`
- `npm run db:migrate`
- `npm run dev`

## Команды тестов и проверки

- `npm run test` — unit/integration тесты.
- `npm run lint` — ESLint (если настроено в CI/локально).
- `npm run typecheck` — проверка типов TypeScript.
- `npm run db:validate` — проверка Prisma schema без подключения к БД.

## Ограничения и guardrails

- Все tenant-sensitive данные должны фильтроваться на уровне service/repository слоя.
- Secrets integrations не хранятся в исходном коде, только в переменных окружения или менеджере секретов.
- Любой outbound call (telephony/AI) через интерфейс и проверку compliance engine.
