# Сценарии симуляции агентной команды

Сценарии проверяют routing, ownership и качество handoff до признания набора role-skills готовым. Если цепочка нелогична или роли конфликтуют, сначала исправляется skill/routing, затем симуляция повторяется.

## 1. Новая продуктовая функция

**Старт:** `product-agent` получает одну задачу ≤1 SP, уточняет цель, journey, acceptance criteria и out of scope по backlog.

**Handoffs:** Product → Architect → Security (если затронуты auth, tenant, compliance или secrets) → Backend → QA → Documentation.

**Валидатор:** `qa-engineer` проверяет acceptance criteria и regression risk; `final-reviewer` сверяет work contract и свежие verification evidence перед merge claim.

**Риск конфликта:** Product может задать техническое решение вместо требования, а Architecture и Backend — по-разному определить границу API. Решение: Owner из `AGENT_OWNERSHIP.md`, ADR для архитектуры и явная эскалация при расширении scope.

## 2. Изменение frontend-сценария

**Старт:** `product-designer` получает подтверждённый пользовательский сценарий; для AI Collector сначала применяет product skill, затем copy/craft skills.

**Handoffs:** Product-designer (+ Product и copy skills) → Frontend → UX review → QA.

**Валидатор:** UX review проверяет flow, состояния, доступность и соответствие дизайну; QA проверяет happy, empty, loading и error paths.

**Риск конфликта:** Frontend может менять продуктовую логику или русский текст без Owner, а Design — предложить данные, которых нет в API. Решение: Product владеет scope, Design — UX, Frontend — реализацией; API-gap возвращается через handoff Backend.

## 3. Изменение Backend/API

**Старт:** `architect-agent` и/или `backend-engineer` получают требование на контракт, domain logic, Prisma, jobs или route.

**Handoffs:** Architect/Backend → Security (обязательно для auth/tenant; также для compliance/secrets) → Test automation → Documentation.

**Валидатор:** `test-automation-engineer` проверяет контракт, негативные сценарии и regression tests; Security подтверждает tenant isolation и fail-closed поведение для своей зоны.

**Риск конфликта:** Backend может считать security review необязательным либо одновременно изменить контракт и клиента. Решение: security gate обязателен по триггерам, breaking API входит в `MUST_ESCALATE`, границы фиксируются ADR/API SoT.

## 4. Исправление дефекта

**Старт:** применяется `systematic-debugging`: воспроизведение, evidence и установление корневой причины до исправления.

**Handoffs:** Systematic debugging → Owner затронутой зоны → QA.

**Валидатор:** QA воспроизводит исходный дефект, подтверждает regression test и проверяет соседние сценарии; перед done применяется `verification-before-completion`.

**Риск конфликта:** QA и разработчик могут спорить о зоне дефекта или исправить симптом в чужом модуле. Решение: Owner определяется по матрице; неясное/мультирольное владение маршрутизирует `team-orchestrator` или человек.

## 5. Deploy с security-риском

**Старт:** изменение окружения, CI, secrets, release gate или live-интеграции совместно оценивают `security-engineer` и `devops-sre`.

**Handoffs:** Security + DevOps → Release → Final Reviewer.

**Валидатор:** `release-manager` проверяет cut criteria и rollback; `final-reviewer` проверяет evidence, secrets handling и legal/DPA live gates.

**Риск конфликта:** Release pressure может привести к обходу compliance, использованию production credentials или включению live telephony без документов. Решение: fail-closed, общий `MUST_ESCALATE`, запрет live без legal memo/DPA; без подтверждения выпуск получает no-go.

## Критерий успешной симуляции

Сценарий считается пройденным, если Owner однозначен, каждый handoff содержит достаточные данные, валидатор может независимо проверить результат, а конфликт разрешается без обхода work contract и проектных инвариантов.
