# External systems integration contract (API/SFTP/Webhooks) v0

## Назначение

Документ описывает, как AI-коллектор будет интегрироваться с внешними системами в MVP Lab и как API/SFTP/webhook-интеграции должны поддерживать воспроизводимость и идемпотентность.

## Поддерживаемые направления интеграций (план на MVP Lab)

### 1) API import/export интеграции (взаимодействие API-first)

#### 1.1 Импорт должников в кампанию

- Канал: inbound API
- Описание: загрузка новых/обновлённых строк должников и их состояний.
- Endpoint (проектируемый): 
  - `POST /tenants/:tenantId/campaigns/:campaignId/debtors/import`
- Источники полей: `externalId`, контактные поля, `debtAmount`, `debtStatus`, `consentStatus`, `phone`, `timezone`.
- Ожидаемый ответ:
  - количество `acceptedCount`/`rejectedCount`,
  - список ошибок с указанием номера строки и причины.

#### 1.2 Экспорт отчётов кампании

- Канал: API polling by partner/BI (пока read API)
- Endpoint (проектируемый): 
  - `GET /tenants/:tenantId/campaigns/:campaignId/report`
- Базовые метрики на v0:
  - totalRecords, attemptedCalls, completedCalls, blockedCalls, ptpCount,
  - usage totals via `usage-events/totals` (если подключены).

### 2) SFTP-интеграции (планируется)

- Формат обмена: CSV/JSONL в зафиксированных папках `incoming/` и `outgoing/`.
- Использование:
  - входящие файлы с обновлениями статуса должников/consent/suppression,
  - выходные отчёты по результатам кампаний и звонков.
- Ожидаемый contract:
  - каждый файл должен иметь manifest с `fileId` и timestamp,
  - повторная загрузка того же `fileId` не должна дублировать изменения.

### 3) Webhook-уведомления (планируется)

- Канал: outbound и inbound callbacks
- Inbound events:
  - `debt.updated` (после изменения статуса долга),
  - `consent.updated` (отзыв/восстановление),
  - `ptp.paid` (подтверждение оплаты),
  - `campaign.status` (изменение статуса кампании со стороны внешней оркестрации).
- Outbound events:
  - `call.started`, `call.completed`, `call.blocked`,
  - `compliance.blocked`, `call.result.created`,
  - `quota.threshold.breached`.

## Идемпотентность входящих событий

Для всех inbound-операций (API/SFTP/webhook) используем единый идемпотентный ключ, чтобы повторная доставка не приводила к дублям.

### Правило

Для каждого события использовать:

- `eventId` — глобальный уникальный идентификатор бизнес-события источника.
- `sourceSystem` — код системы-отправителя.
- `idempotencyKey = sha256(sourceSystem + ":" + eventId)`.

Обработка:

1. Перед применением изменений проверяем `idempotencyKey` в dedup-store.
2. Если ключ уже обработан:
  - возвращаем ранее сохранённый ответ (или `200 OK` без повторного применения),
  - не создаём повторных `UsageEvent`, `ComplianceDecision`, `CallAttempt`, `CallResult`.
3. Если ключ новый:
  - применяем изменения,
  - сохраняем ключ в dedup-store со статусом успеха/ошибки и `processedAt`.

### Рекомендуемые TTL

- Минимум 14 дней для MVP по входящим webhook-событиям.
- Для SFTP можно использовать отдельный срок `30 дней` по `fileId`.

## Требования безопасности и трассируемости

- Все inbound интеграционные вызовы должны быть tenant-scoped.
- Все изменяющие действия должны писаться в `AuditLog` с:
  - `sourceSystem`,
  - `idempotencyKey`,
  - `eventId`,
  - ссылкой на входящее событие.

## Этапы внедрения (план)

- 1 этап (MVP): API import и reporting в `report` + `usage-events/totals`.
- 2 этап: webhooks for status synchronization + callback signing.
- 3 этап: SFTP fallback для batch-операций и миграционного обмена.
