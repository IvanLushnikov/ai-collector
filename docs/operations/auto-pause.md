# Auto-pause (автопауза) кампании

Документ описывает коды причин автопаузы для кампаний обзвона и события, после которых система должна инициировать перевод кампании в `auto_paused`.

## Причины (reason codes)

- `compliance_violation`
  - Compliance-блокировки по правилам (например, массовая блокировка звонков из-за нарушения статуса должника/согласий).
  - Запускающие события:
    - `compliance.decision_blocked` — блокирующее решение для `CallAttempt`.
    - `compliance.blocking_rate_exceeded` — превышение порога блоков в окне для кампании.

- `complaint_spike`
  - Резкий рост жалоб или негативной обратной связи.
  - Запускающие события:
    - `complaint.received` — получение жалобы.
    - `complaint.spike_threshold_exceeded` — превышение порога жалоб в окне.

- `recording_failed`
  - Критические ошибки записи/воспроизведения разговора.
  - Запускающие события:
    - `usage.recording_failed` — ошибка генерации/сохранения записи для звонка.
    - `telephony.recording_error` — ошибка поставщика записи.

- `handoff_overloaded`
  - Перегрузка потока handoff.
  - Запускающие события:
    - `handoff.queued` — рост backlog очереди handoff выше порога.
    - `handoff.backlog_threshold_exceeded` — превышение допустимой задержки/размера очереди.

- `provider_sla_failed`
  - Нарушение SLA связи/временных ограничений телеком-провайдера.
  - Запускающие события:
    - `provider.call_sla_missed` — превышение допустимого времени запуска/завершения звонка.
    - `provider.healthcheck_failed` — падение health-check интеграции.

## Контролируемый запуск (controlled launch) как часть readiness

- Controlled launch используется как промежуточный режим до полного «go-live», если compliance/quality не в `готово`.
- UI до запуска должен показывать отдельный статус этапа с источниками доказательств:
  - readiness state: `готово`, `нужна проверка`, `автопауза`, `заблокировано compliance`, `ожидает подтверждения`.
  - статусы шагов импорта, телеком-контура и сценария.
  - список blocking reasons с ссылкой/подсветкой в конкретный шаг мастера или карточке кампания.

В MVP-прототипе текущая wiring:

- Экран мастера step 5 `Проверка перед запуском` использует `wizardStepStates` и состояние `wizardStepStates.readiness.status`.
- Экран кампании вкладки `launch` дублирует ту же модель через `syncCampaignLaunchReadinessPanel(...)`.
- При `готово` для шага readiness кнопка `Запустить controlled launch` активна; при остальных состояниях (`нужна проверка`, `автопауза`, `заблокировано compliance`, `ожидает подтверждения`) кнопка блокируется.
- Для каждой причины блокировки/предупреждения формируется список из backend-like evidence (`blockingReasons` + `nextActions`) и связывается в UI-строки checklist по этапам: параметры, база, телефония, сценарий, лимиты.

Что должна показывать checklist-панель readiness в UI:

- `готово`: все required источники в `OK`, кнопка `Запустить controlled launch` активна.
- `нужна проверка`: не пройдены обязательные источники (`importReport`, `telephonyProbeResult`, `scriptValidationReport`), кнопка `Запустить` выключена, доступен `Перепроверить backend-статусы`.
- `автопауза`: есть `warning`-источники (частичный импорт, частичные policy/quality риски), `Запустить controlled launch` disabled до проверки responsible и без `auto-pause` режима.
- `заблокировано compliance`: есть блокирующие `compliance`-факты, запуск заблокирован до снятия `blocking` причины.
- `ожидает подтверждения`: присутствуют `review`/`awaiting` причины (например, политика/сценарий/handoff), требуется кнопка/маршрут подтверждения responsible или compliance owner.

Матрица состояния:

1. `готово` — все обязательные проверки пройдены, можно запускать controlled launch с минимальным риском.
2. `нужна проверка` — один или несколько шагов не запускались или не подтвердились backend; запуск недоступен.
3. `автопауза` — есть предупреждения (например, частичный успех импорта/предупреждения сценария), запуск возможен только в safe mode и с последующим ручным подтверждением responsible.
4. `заблокировано compliance` — blocking reasons по правилам/решениям `compliance`; запуск запрещён до устранения причины.
5. `ожидает подтверждения` — требуется подтверждение responsible или compliance owner перед выходом из черновика.

Что видно в отчёте перед запуском:

- итоговый `readinessSummary` с последней датой проверки;
- перечень evidence `importReport`, `telephonyConnectionStatus`, `telephonyProbeResult`, `scriptValidationReport`, `campaignPolicyReport`, `campaignLimitsConfig`;
- список причин и рекомендованные действия (например, загрузить новый файл, провести повторный test connection, подтвердить сценарий).

Пример минимального evidence-бандла для чеклиста:

- `importReport.id`, `importReport.rowsAccepted`, `importReport.rowsRejected`, `importReport.errorCodes`
- `telephonyProbeResult.provider`, `telephonyProbeResult.result`, `telephonyProbeResult.lastCheckedAt`
- `scriptValidationReport.version`, `scriptValidationReport.passedRules`, `scriptValidationReport.blockingRules`, `scriptValidationReport.recommendations`
- `campaignLimitsConfig.timeWindow`, `campaignLimitsConfig.dialAttempts`, `campaignLimitsConfig.excludeModes`

## Что делать после автопаузы

### Режимы остановки кампании

- `manual_paused`
  - Причина: пользовательская пауза оператора (перерасстановка настроек, сценария, базы, телефонии).
  - Блокирование: прекращение создания новых `CallAttempt` до снятия паузы.
  - Возобновление: кнопка `resume` называется `Снять паузу` и работает без дополнительного подтверждения.
  - Для трассировки важны записи `audit log` по изменению статуса и actor.

- `auto_paused`
  - Причина: автоматическая остановка по risk-событию.
  - Блокирование: прекращение создания новых `CallAttempt` до safe-resume.
  - Возобновление: кнопка `resume` называется `Безопасное возобновление`; перед переходом в `running` должен пройти UI-процесс с 3-чекпоинтами.
  - В safe-resume обязателен вывод `autoPauseEvent`, `autoPauseReason`, `autoPauseImpact`.

- `stopped`
  - Причина: финальное завершение кампании оператором или системной политикой.
  - Возобновление недоступно без нового controlled-start.

1. Перевести кампанию в статус `auto_paused` и остановить создание новых `CallAttempt`.
2. Записать в `audit log` событие автопаузы с `reasonCode` и диагностическими метаданными.
3. Уведомить ответственных (owner/collection_manager) о причине и следующем действии.
4. Ожидать ручного подтверждения перед возобновлением: корректировка правил, проверка интеграций, согласование с поддержкой.
5. Возобновление только через `POST /tenants/:tenantId/campaigns/:campaignId/safe-resume` с чеклистом. Обычный `PATCH .../status` из `auto_paused` запрещён, в том числе в `running` и в `review`.
6. После safe-resume кампания переходит в `review` или `ready` (не сразу в `running`). Audit: `campaign.safe_resumed`. Force-call нет.

## Безопасное возобновление после risk-события

Для `campaign.auto_paused` требуется отдельный экран подтверждения с обязательными пунктами:

1. Подтверждение причины автопаузы с кодом `reasonCode` и перечнем evidence по последнему risk-событию.
2. Проверка устранения причины на уровне кампании (все критические review-пункты закрыты).
3. Ручная постановка признака `compliance_owner` / `owner` о согласии на продолжение.

Поток возобновления не может быть one-click:

- `PATCH .../status` из `auto_paused` не переводит ни в `running`, ни в `review`;
- кнопка `resume` в статусе `auto_paused` открывает экран `safe resume`;
- в `safe resume` обязательно показываются `autoPauseEvent`, `autoPauseReason`, `autoPauseImpact`;
- кнопка подтверждения активируется только после 3-х чеков выше;
- после подтверждения `POST .../safe-resume` пишет audit `campaign.safe_resumed` с пунктами чеклиста (`reasonAcknowledged`, `causeResolved`, `ownerApproved`) и `forceCall: false`;
- целевой статус: `review` или `ready`. Прямой переход в `running` запрещён.

Только после повторного readiness и controlled launch кампания может снова стать `running`.

## Базовый поток автоматики

- Сервис наблюдения по событиям `compliance`, `complaint`, `usage`, `telephony` собирает метрики.
- При срабатывании порога формирует `reasonCode` и инициирует автопаузу.
- Каждый запуск фиксируется в audit и доступен для расследования/отката.
