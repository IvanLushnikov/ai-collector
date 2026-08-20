# Контекст проекта для агентов

Этот документ — краткий источник истины для работы агентов в AI Collector. Перед изменениями также прочитайте `AGENTS.md`, применимые ADR и документы предметной зоны.

## 1. Продукт

AI Collector — compliance-first B2B-продукт для коллекшн-кампаний и обзвона. Текущее состояние — Controlled Pilot skeleton: управляемая backend-first платформа с моделью данных, API, compliance, импортом базы, журналом решений и отчётностью из реальных событий.

Основной принцип: **автоматизировать только то, что можно безопасно выполнить, объяснить и доказать**.

## 2. Архитектура

- Runtime: Node.js 20.
- Язык: TypeScript.
- API: Fastify.
- Доступ к данным: Prisma.
- Основная БД: PostgreSQL 16.
- Очереди и фоновые задания: Redis и BullMQ.
- Тесты: Vitest.

## 3. Карта репозитория

- `src/` — backend: auth, compliance, routes, telephony, speech, dialogue, secrets, jobs и другие модули.
- `tests/` — Vitest-тесты и тестовая инфраструктура.
- `prototype.html` — кликабельный прототип кабинета.
- `public/` — публичный сайт и материалы GitHub Pages.
- `docs/` — ADR, compliance, API, operations и продуктовая документация.
- `skills/` — process-, product- и role-skills; правила маршрутизации описаны в `AGENTS.md` и `skills/README.md`.

## 4. Критические инварианты

1. Изоляция tenant-данных обязательна на каждом пути чтения и записи.
2. Любой dial проходит через compliance-проверку в режиме fail-closed.
3. Решения и значимые действия оставляют проверяемый audit trail.
4. За одну итерацию выполняется не более одной задачи `1 SP`, если человек явно не попросил иначе.

## 5. Границы безопасности

- Секреты и ключи BYOK хранятся через envelope-подход; секреты не попадают в git, логи и документацию.
- Cookie-сессии защищаются проверкой CSRF Origin.
- Live-режим недопустим без утверждённых legal memo и DPA.
- Production identity не должна опираться на небезопасный header fallback.

## 6. Соглашения разработки

- Соблюдайте TypeScript- и ESLint-правила репозитория.
- Сохраняйте существующие модульные границы; архитектурные изменения фиксируйте ADR.
- Сначала проверяйте существующую реализацию и не создавайте параллельные механизмы.
- Делайте минимальное изменение в рамках одной задачи.

## 7. Тестирование

- Основной тестовый контур — Vitest.
- Перед `test` и `typecheck` должен проходить `npm run verify:skills`.
- Выбирайте проверки по риску изменения: unit/integration-тесты, lint, typecheck и ручные проверки зоны.
- Не объявляйте работу завершённой без свежей проверки по `skills/verification-before-completion/SKILL.md`.

## 8. Развёртывание

- Локальная инфраструктура запускается через `docker compose`: PostgreSQL 16 и Redis.
- Папка `public/` публикуется через GitHub Pages.
- CI workflows запускают проверки репозитория для pull request и push в основные ветки.
- Изменения окружений, rollback и production-параметров координируются с владельцами DevOps/Release.

## 9. Definition of Done

Definition of Done определяется goal prompt задачи и `docs/agents/AGENT_WORK_CONTRACT.md`. Обязательны соблюдение scope, релевантные тесты, оценка security/regression risk, обновление документации при смене поведения, понятный handoff и применение `verification-before-completion` перед заявлением «готово».

## 10. Известный долг и блокировки

- История typecheck/CI требует не ослаблять проверки и не маскировать существующие ошибки.
- `T-149` — Exolve HTTP; live-интеграция заблокирована до legal/DPA.
- `T-157` — SpeechKit HTTP; live-интеграция заблокирована до legal/DPA.
- `T-203` — retention; выполнение заблокировано до legal/DPA.

## 11. Опасные операции

Без явного согласования не выполняйте:

- использование или изменение production credentials;
- destructive migrations;
- live telephony;
- удаление данных.

При необходимости такой операции остановитесь и эскалируйте владельцу и человеку.

## 12. Источники истины

При конфликте уточняйте решение у владельца зоны. Основные SoT:

- ADR в `docs/decisions/`;
- compliance rulebook в `docs/compliance/rulebook-v1.md`;
- очередь задач `TECH_BACKLOG_1SP.md`;
- продуктовый язык `PRODUCT_LANGUAGE.md`;
- bootstrap и routing в `AGENTS.md`;
- фактическое поведение кода и тестов.

## 13. Владение зонами

Owner и Consulted для каждой зоны определены в [`AGENT_OWNERSHIP.md`](./AGENT_OWNERSHIP.md). Если Owner неясен или изменение затрагивает несколько зон, передайте маршрутизацию `team-orchestrator` либо человеку.
