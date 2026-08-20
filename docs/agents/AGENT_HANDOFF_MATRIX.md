# Матрица передачи работы между агентами

Каждая передача оформляется по `templates/AGENT_HANDOFF_TEMPLATE.md`. Owner зоны остаётся ответственным за корректность решения после консультации.

| From | To | Когда | Что передаётся | Что проверить получателю |
|---|---|---|---|---|
| Product | Architecture | Scope и acceptance criteria согласованы; требуется технический дизайн | Цель, journeys, ограничения, backlog item, out of scope, assumptions | Непротиворечивость требованиям, границы модулей, необходимость ADR, размер ≤1 SP |
| Architecture | Backend | Определены модульные границы и API contract | ADR/решение, контракты, модель данных, инварианты, риски | Соответствие существующему коду, tenant isolation, миграции, обратная совместимость |
| Architecture | Frontend | Определены UI/API boundaries | API contract, состояния, error model, ограничения данных | Доступность нужных данных, обработка loading/empty/error, отсутствие обхода backend-инвариантов |
| Design | Frontend | UX flow и визуальное решение готовы к реализации | Макет/спецификация, состояния, RU-copy, responsive и accessibility требования | Соответствие product skill, реализуемость, все состояния и пользовательские тексты |
| Backend | Frontend | API или контракт данных готов | Endpoints, schema, auth, ошибки, примеры, ограничения | Контракт на реальном API, tenant context, ошибки, совместимость типов |
| Frontend | Backend | UI выявил потребность или дефект API | Пользовательский сценарий, запрос/ответ, воспроизведение, ожидаемый контракт | Не является ли это UI-проблемой; влияние на domain/API и другие клиенты |
| Security | Architecture | Найден security/compliance риск в решении | Threat/risk, затронутые инварианты, обязательные controls, решение об эскалации | Controls встроены в границы и ADR; fail-closed поведение сохранено |
| Security | Backend | Требуется реализация security/compliance controls | Правило, threat model, acceptance criteria, audit requirements | Auth/tenant/secrets/compliance реализованы и покрыты негативными тестами |
| QA | Developers | Проверка выявила дефект или пробел | Reproduction, expected/actual, evidence, severity, затронутые тесты | Корневая причина, минимальный fix, regression test, отсутствие обхода проверки |
| Developers | QA | Реализация готова к независимой проверке | Diff summary, acceptance criteria, выполненные проверки, риски, test data | Happy/error paths, regression risk, security/permissions и соответствие требованиям |
| DevOps | Backend | Инфраструктура накладывает runtime/CI требования | Env contract, limits, health/rollback/observability требования | Совместимость приложения, secrets handling, graceful failure, миграционный порядок |
| Backend | DevOps | Изменение требует окружения или выкладки | Runtime/env изменения, зависимости, миграции, health checks, rollback notes | CI/deploy воспроизводимость, секреты, порядок rollout/rollback, observability |
| QA | Release | Acceptance и regression проверки завершены | Test summary, evidence, известные дефекты, residual risks, go/no-go | Полнота release criteria, блокирующие риски, live gates |
| Release | Documentation | Состав и ограничения релиза зафиксированы | Release notes, изменения поведения, known issues, rollout/rollback | Документация соответствует фактическому релизу и не обещает заблокированный live |
| Feedback | Skill Governor | Обнаружен повторяющийся сбой routing/skill | Примеры, частота, impact, предполагаемая причина, желаемое поведение | Доказанность паттерна, отсутствие дубликата, слой и минимальная правка |
| Любой агент | Final Reviewer | Перед заявлением «готово» или merge claim | Goal, work contract, diff, verification evidence, risks, handoffs | Acceptance criteria, ownership, свежесть проверок, security/compliance, незакрытые блокеры |

## Правила

1. Передавать только проверенное состояние и явно отмечать непроверенное.
2. Не скрывать assumptions, известные риски и блокеры.
3. Получатель проверяет перечисленные условия и эскалирует конфликт Owner.
4. Handoff не заменяет final verification и не разрешает опасные операции.
