# API contract governance

## Source of truth

`src/contracts/openapi-v1.ts` в backend-репозитории — исполняемый источник истины для публичного HTTP API v1. `GET /openapi/v1.json` публикует ровно этот документ. Frontend не копирует DTO вручную и не определяет compliance, роли или tenant context из браузерных данных.

## Изменение контракта

1. Добавить или изменить маршрут, его request/response schema и machine-readable error в backend.
2. В той же change-set обновить `openapi-v1.ts` и contract test.
3. Для additive changes сохранить v1 backward-compatible; breaking change выпускается только под `/openapi/v2.json` и `/v2` route prefix после migration window.
4. Записать user-visible breaking change в release notes до rollout; frontend переключается после проверки staging against published contract.

## Ownership and CI

- Backend владеет OpenAPI, error envelope и changelog API.
- Frontend владеет API transport/UI state и использует cookie session; он не передаёт tenant или role headers как источник полномочий.
- CI backend запускает API contract tests вместе с route tests. CI frontend получает опубликованный OpenAPI artifact и проверяет используемые operation IDs до deploy.
- Generated typed client имеет смысл добавлять вместе с SPA/module build. До этого static `prototype.html` использует узкий transport layer, а API paths, используемые им, закреплены contract test; это не повод поддерживать второй «ручной» контракт.

## Compatibility rules

- Пагинация: новые list endpoints принимают `limit` и `offset`, возвращают deterministic order; изменение defaults считается compatibility-sensitive.
- Mutations, вызывающие provider side effect, требуют idempotency key и audit event; повтор webhook/event delivery должен быть безопасен.
- Любой 4xx/5xx ответ использует `{ error, message?, issues? }`; UI не делает fallback к demo data для evidence, compliance или reports.
