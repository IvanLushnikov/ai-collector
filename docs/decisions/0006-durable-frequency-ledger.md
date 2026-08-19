# Decision: durable и идемпотентный frequency ledger

Дата: 19.08.2026  
Статус: принято для реализации  
Связанные документы: [rulebook v1](../compliance/rulebook-v1.md), [technology map](../architecture/2026-08-17-technology-map.md), [telephony ADR](./0003-live-voice-provider.md)

## Решение

1. Frequency ledger — tenant-scoped PostgreSQL данные, а не состояние Node.js процесса.
2. Для каждой учитываемой попытки хранится `FrequencyLedgerAttempt` с уникальным `callAttemptId`. Это idempotency key для повторной доставки событий от worker или телефонии.
3. Вставка attempt и upsert/increment day/week/month счётчиков выполняются в одной транзакции. Повторный `callAttemptId` не меняет счётчики.
4. Приложение создаёт один repository при bootstrap и передаёт его в pre-dial compliance и обработку попыток. In-memory adapter допустим только для изолированных тестов или явно переданных тестовых зависимостей.
5. Лимиты 1/2/8 остаются продуктовым rulebook cap, а не утверждением о юридическом правиле. Включение live enforcement остаётся закрытым legal sign-off и production telephony integration.

## Почему

Process-local `Set`/`Map` обнуляется при перезапуске и расходится между pod/worker. Порядок `check → mark → increment` также не защищает от конкурентной доставки. Уникальная attempt-запись делает повтор безопасным, а транзакция исключает частично записанные buckets.

## Ограничение текущего инкремента

Этот change делает хранение и учёт попыток устойчивыми. Полноценное pre-dial reservation до вызова внешнего провайдера требует отдельного live-call orchestration path с outbox/worker и подтверждением provider start; sandbox proxy не является таким путём.

