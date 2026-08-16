# On-prem/private cloud assessment checklist

## Цель

Чеклист оценки readiness для размещения AI-коллектора в on-prem/private cloud с фокусом на безопасность, доступность и соответствие compliance-требованиям.

## 1) Данные и границы tenancy

- Где хранятся все данные: PostgreSQL, файловые артефакты, очереди, кэш, временные файлы.
- Как выделяется storage per tenant (logical/physical isolation).
- Как обеспечивается удаление tenant-данных (GDPR-like/региональные требования) и SLA на `restore`.
- Политики retention для:
  - raw аудиофайлы и transcript,
  - transcripts/промпты,
  - audit/logs,
  - диагностика provider-call.
- Нужна ли дедубликация по tenant-scoped ключам для `UsageEvent`/`CallAttempt`.

## 2) Секреты и ключи интеграций

- Где хранятся секреты: менеджер секретов (Vault/KMS/secret manager), rotation policy.
- Секреты для:
  - telephony providers,
  - AI/LLM/API,
  - email/SMS/SFTP endpoints (если есть).
- Нет секретов в:
  - исходном коде,
  - миграционных/тестовых репозиториях,
  - явных логах.
- Модель доступа к секретам (service account + least privilege).

## 3) Телефония и аудио-интеграции

- Поддерживаемые провайдеры в он-прем/пристатичном контуре.
- План HA/DR для голосового провайдера.
- Как реализован fallback при деградации провайдера:
  - ручной стоп кампаний,
  - переключение на резервный провайдер,
  - повторные попытки.
- Идемпотентность внешних событий (если провайдер отправляет webhooks/callbacks).
- Ретеншн CDR и способ reconcile с usage ledger.

## 4) Telemetry и observability

- Какие метрики обязательны:
  - call_started/call_completed,
  - latency по polling/answer-time,
  - error rates по compliance blocks и telephony failures,
  - queue lag/worker health,
  - storage growth.
- Корреляционные IDs:
  - `tenantId`, `campaignId`, `callAttemptId`, `audit event id`.
- Алерты и runbook на инциденты (например breach SLA compliance, spike жалоб, провал записи).
- Ретеншн логов и ротация.

## 5) Обновления и эксплуатация

- Процесс обновления компонентов (app, зависимости, модели, схемы БД) в private cloud.
- Как выполняются миграции БД с tenant isolation в уме.
- Процедуры rollback:
  - для API,
  - для schema,
  - для интеграционных настроек.
- Как верифицируется успешность deployment до включения трафика.

## 6) Безопасность и аудит

- Проверка tenant isolation на уровне БД и API middleware.
- Аудит trail для ключевых действий:
  - изменения конфигурации кампании,
  - запуск/остановка кампаний,
  - изменения интеграционных настроек,
  - конфигурации доступа.
- Incident response playbook и time-to-response цели.

## 7) Производительность и SLA

- Целевые показатели:
  - RPS API,
  - одновременные звонки,
  - время ответа маршрутов compliance-critical.
- Нагрузочное тестирование на worst-case: spike дебитора и пиковые campaigns.
- Пределы ресурсов per tenant и лимиты предотвращения «tenant runaway». 

## 8) Compliance-readiness в enterprise контуре

- Как хранится и проверяется доказательная база для решений:
  - compliance checks,
  - blocked call outcomes,
  - audit trail.
- Гарантии соответствия региональным требованиям по работе с персональными данными.
- Процедура внутреннего security review перед запуском каждого tenant.

## 9) On-prem внедрение (чеклист запуска)

- [ ] Есть отдельный tenant-scoped план изоляции на уровне сети, БД, файлов.
- [ ] Секреты вынесены из кода и доступны только сервисам с минимальными правами.
- [ ] Настроены метрики/алерты для compliance и telephony операций.
- [ ] Есть playbook для отката и аварийного режима.
- [ ] Проведена проверка провайдера/рекон-сопоставления usage и CDR.
- [ ] Согласованы политика retention и удаление данных.
