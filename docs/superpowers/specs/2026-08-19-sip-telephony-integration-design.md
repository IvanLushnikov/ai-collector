# SIP Telephony Integration Design

Дата: 19.08.2026  
Статус: draft  
Контекст: AI Collector, controlled pilot, BYO SIP как базовая модель интеграции  
Связанные документы: `docs/decisions/0003-live-voice-provider.md`, `docs/decisions/0004-speech-llm-stack.md`, `docs/domain-model.md`, `docs/calls-api.md`, `docs/compliance/rulebook-v1.md`, `docs/operations/auto-pause.md`

## 1. Цель

Определить, как AI Collector должен интегрироваться с SIP-телефонией клиента в controlled pilot, как управлять нагрузкой, как нормализовать и показывать статусы звонков, и как хранить telephony-evidence вместе с транскрипцией и бизнес-результатом разговора.

Документ не фиксирует юридические факты и не открывает live по умолчанию. Он задает продуктово-техническую рамку, совместимую с текущими ADR и fail-closed подходом проекта.

## 2. Рекомендация

Рекомендуемый путь для v1/pilot:

1. Базовая модель интеграции: **client-managed SIP / BYO SIP**.
2. AI Collector **не управляет физическими линиями, trunk capacity и vendor routing напрямую**.
3. AI Collector управляет только **своим безопасным уровнем нагрузки**:
   - сколько новых звонков можно одновременно запускать от нашей кампании;
   - когда нужно замедлиться, остановиться или уйти в автопаузу;
   - какие статусы считать допустимыми, терминальными или риск-сигналами;
   - какие evidence обязательны для продолжения live.
4. Все vendor-specific SIP события нормализуются в наш внутренний статусный слой, а raw SIP/CDR payload хранится отдельно как техническое evidence, но не становится продуктовым API-контрактом.

Иными словами: **клиент отвечает за телеком-контур, мы отвечаем за orchestration, compliance, status normalization, evidence и безопасную интенсивность запуска.**

## 3. Почему не стоит строить свой SIP-стек

Это согласуется с уже принятым ADR:

- в репозитории зафиксировано, что свой SIP-стек и собственную АТС для пилота не строим;
- домен уже отделяет `TelephonyConnection` от `CallAttempt` и `CallResult`;
- текущий `VoiceProviderAdapter` предполагает слой нормализации поверх внешнего поставщика;
- readiness live уже зависит не от факта "SIP доступен", а от подтвержденных capability: `marking`, `recording`, `handoff`.

Для BYO SIP это означает, что с точки зрения продукта мы должны подключаться не к "любой телефонии вообще", а только к клиентскому контуру, который способен подтвердить нужный нам операционный и compliance-контракт.

## 4. Варианты интеграции

### Вариант A. Тонкий SIP/BYOT адаптер поверх клиента

Суть:

- клиент дает SIP trunk / SIP URI / параметры webhook/CDR;
- мы строим `SipVoiceProviderAdapter`;
- адаптер умеет: старт звонка, получить статус, завершить звонок, принять webhook событий, выполнить probe capability;
- диалог, compliance, ASR/TTS/LLM и аудит остаются у нас.

Плюсы:

- соответствует выбору пользователя;
- сохраняет наш контроль над состояниями, evidence и rulebook;
- позволяет подключать разные SIP-контура через единый нормализованный контракт.

Минусы:

- выше вариативность интеграций клиента;
- придется жёстко валидировать capability каждого контура;
- часть клиентов не даст нужный набор сигналов без доработки своей телефонии.

### Вариант B. SIP клиента через "серый" универсальный коннектор без capability contract

Суть:

- принимаем любой SIP, минимально стартуем звонки, а остальное живем "по факту".

Минусы:

- нет гарантии записи, маркировки, handoff, корректных callback;
- невозможно доказуемо вести audit и reconciliation;
- высокий риск неконсистентных статусов;
- противоречит compliance-first архитектуре.

Этот вариант не рекомендован.

### Вариант C. Гибрид BYO SIP + список сертифицированных паттернов интеграции

Суть:

- базовая модель BYO SIP;
- но мы поддерживаем не "любой SIP", а 2-3 профиля подключения:
  - SIP trunk + webhook status callbacks;
  - SIP trunk + polling + CDR reconciliation;
  - SIP provider API + SIP handoff destination.

Плюсы:

- снижает хаос интеграций;
- упрощает rollout и поддержку;
- позволяет заранее описать mandatory fields и failure modes.

Минусы:

- ограничивает self-service на старте;
- потребует onboarding checklist по каждому профилю.

Для пилота это лучший компромисс. Ниже в документе подразумевается именно этот вариант.

## 5. Целевая архитектура интеграции

## 5.1. Слои

1. `TelephonyConnection`
   - tenant-scoped конфигурация подключения.
   - хранит только безопасные метаданные подключения и capability snapshot.

2. `SipVoiceProviderAdapter`
   - нормализует vendor/SIP события в внутренние `VoiceCallStatus`;
   - умеет `startCall`, `getCallStatus`, `hangupCall`, `probeCapabilities`;
   - принимает callbacks/webhooks/CDR.

3. `Call Orchestrator`
   - создает `CallAttempt`;
   - связывает звонок с кампанией, записью должника и выбранным соединением;
   - принимает решения о запуске/повторе/остановке;
   - контролирует concurrency внутри нашей системы.

4. `Compliance Engine`
   - допускает или блокирует старт до звонка;
   - не зависит от SIP-вендора;
   - пишет `ComplianceDecision`.

5. `Call Event Ingestion`
   - принимает webhook/poll/CDR события;
   - обновляет технический статус звонка;
   - пишет timeline событий;
   - запускает side effects: transcript job, QA queue, auto-pause, usage, reconciliation.

6. `Evidence Store`
   - транскрипт, запись, raw event refs, статусные переходы, outcome, audit events.

## 5.2. Integration contract

Чтобы SIP-контур клиента считался пригодным для pilot/live, он должен подтвердить:

- запуск звонка и стабильный `providerCallId`/`externalCallId`;
- получение промежуточных и финальных статусов;
- признак ответа абонентской стороны;
- отдельные статусы `busy`, `no_answer`, `voicemail`, `failed`, `transferred`;
- возможность записи разговора или надежной ссылки на нее;
- возможность забрать аудио или медиапоток для нашей дальнейшей расшифровки;
- возможность handoff на номер или очередь клиента;
- support для маркировки или договорного механизма, подтверждающего выполнение `R-MARKING`;
- webhook или CDR с идемпотентным внешним идентификатором.

Если capability не подтверждена, readiness live = `blocked`.

## 6. Управление нагрузкой

## 6.1. Что не контролируем мы

AI Collector не должен становиться источником истины для:

- количества физических линий SIP;
- carrier concurrency;
- операторских лимитов trunk;
- codec/network tuning;
- очередей и маршрутизации внутри АТС клиента.

Это ответственность клиентской телефонии.

## 6.2. Что обязаны контролировать мы

Даже если линии задает клиент, AI Collector должен иметь свои защитные лимиты:

1. `maxConcurrentDialing`
   - сколько звонков наша кампания может одновременно держать в не-терминальном состоянии.

2. `maxNewCallsPerMinute`
   - защита от burst даже при большом trunk capacity.

3. `maxHandoffQueueDepth`
   - если handoff backlog превышен, новые live-звонки не стартуют.

4. `maxProviderErrorRate`
   - всплеск `failed`/`unknown`/timeout переводит кампанию в автопаузу.

5. `maxRecordingFailureRate`
   - если отвеченные звонки системно приходят без записи/транскрипта, live надо останавливать.

6. `perCampaignCap`
   - controlled pilot cap на объем звонков и/или attempts в окне.

## 6.3. Рекомендуемая модель ownership

Рекомендуемая модель:

- клиент задает свой операционный лимит доступных линий;
- мы сохраняем его как `providerDeclaredCapacity` или `clientDeclaredCapacity`;
- система вычисляет **эффективный лимит запуска**:
  - `effectiveConcurrency = min(clientDeclaredCapacity, campaignConcurrencyLimit, platformSafetyLimit, handoffSafeLimit)`

Таким образом:

- клиент не может заставить систему стартовать больше, чем безопасно для нас;
- мы не обязаны знать реальную физическую topology его SIP, но обязаны ограничить свою генерацию вызовов;
- при обнаружении расхождения между заявленной capacity и фактическими статусами (`busy`, queue overflow, reject) система должна снижать нагрузку или уходить в `auto_paused`.

## 6.4. Рекомендуемое поведение на старте пилота

Для pilot не давать полную self-service свободу по concurrency.

Нужны два уровня:

- `declared by customer`: "сколько одновременных звонков способен принять ваш SIP-контур";
- `approved by platform`: "какой лимит разрешен для этой кампании сейчас".

Тогда в UI и БД это не одна цифра, а минимум две:

- техническая емкость подключения;
- разрешенный лимит controlled pilot.

## 6.5. Автоматическая реакция на нагрузку

Система должна реагировать на следующие симптомы:

- рост `busy` выше порога;
- рост `unknown`/timeout webhook gap;
- handoff queue saturation;
- provider response latency SLA miss;
- CDR/status mismatch spike;
- answered calls without recording/transcript evidence.

Реакции:

- временное снижение concurrency;
- блок новых стартов на connection level;
- `campaign.auto_paused` с `provider_sla_failed`, `handoff_overloaded` или `recording_failed`;
- создание review item для integration admin.

## 7. Модель статусов звонка

## 7.1. Почему нужен двухслойный статус

В проекте уже есть правильное разделение:

- `CallAttempt.status` — техническое состояние попытки;
- `CallResult.outcome` — бизнес-исход разговора.

Это разделение нужно сохранить и усилить. Один статус не должен одновременно отвечать на три вопроса:

- дошел ли вызов до абонента;
- состоялся ли разговор;
- какой бизнес-результат получен.

## 7.2. Рекомендуемые слои состояния

Нужно хранить и отображать минимум 4 слоя:

1. `dialStatus` / технический статус попытки
2. `conversationStatus` / состояние разговора как evidence-процесса
3. `businessOutcome`
4. `complianceStatus`

### 1. Dial status

Нормализованный enum попытки звонка:

- `created` — попытка создана локально, еще не отправлена провайдеру
- `queued`
- `dialing`
- `ringing`
- `answered`
- `in_conversation`
- `handoff_requested`
- `transferred_to_handoff`
- `completed`
- `no_answer`
- `busy`
- `voicemail`
- `failed`
- `cancelled`
- `blocked`
- `unknown`

Для обратной совместимости текущие `VoiceCallStatus` и `CallAttemptStatus` можно считать сокращенным подмножеством этого списка.

### 2. Conversation status

Отдельный статус evidence-слоя:

- `not_started`
- `in_progress`
- `awaiting_recording`
- `awaiting_transcription`
- `transcribed`
- `transcription_failed`
- `recording_missing`
- `review_required`
- `finalized`

Этот слой нужен, потому что звонок может уже завершиться технически, но evidence pipeline еще не завершен.

### 3. Business outcome

Оставить отдельным слоем и не смешивать с dial status:

- `not_called`
- `no_answer`
- `callback_requested`
- `wrong_number`
- `ptp_created`
- `handoff`
- `dispute`
- `blocked`
- `error`

В дальнейшем outcome можно расширять, но только из product/backend источника истины.

### 4. Compliance status

Для конкретной попытки полезно вычислять:

- `allowed`
- `blocked`
- `review_required`
- `auto_paused_after_call`

Даже если в текущей модели решение до звонка бинарное (`allow`/`block`), в UI и аналитике этот слой нужен отдельно.

## 7.3. Правила переходов

Ключевые переходы:

- `created -> queued -> dialing -> ringing -> answered -> in_conversation -> completed`
- `ringing -> no_answer`
- `ringing -> busy`
- `ringing -> voicemail`
- `queued|dialing|ringing -> failed`
- `answered|in_conversation -> transferred_to_handoff`
- `answered|completed -> recording_missing` не как `dialStatus`, а как `conversationStatus`
- любой технический финал без достаточного evidence не должен автоматически считаться "успешно закрытым" с точки зрения pilot safety

## 7.4. Источники истины по статусам

Приоритет источников:

1. наш локальный lifecycle event (`CallAttempt created`)
2. provider webhook/callback
3. status polling
4. CDR reconciliation
5. ручной review / system correction event

Если источники противоречат друг другу:

- не перезаписывать молча;
- писать `cdr.mismatch`/`status_mismatch`;
- сохранять оба значения в evidence;
- поднимать review, если расхождение влияет на usage, reporting или compliance.

## 8. Как возвращать и показывать статусы

## 8.1. API-модель

API карточки звонка должно возвращать не один `status`, а структуру вида:

```json
{
  "attemptStatus": "ringing",
  "attemptPhase": "active",
  "conversationStatus": "awaiting_transcription",
  "businessOutcome": null,
  "complianceStatus": "allowed",
  "providerStatus": {
    "normalized": "ringing",
    "raw": "183 Session Progress",
    "source": "webhook",
    "receivedAt": "2026-08-19T09:00:00.000Z"
  }
}
```

`raw` не обязателен в массовых списках и может быть скрыт для большинства ролей.

## 8.2. Что показывать в списке звонков

В таблице журнала звонков нужны отдельные колонки:

- `Должник`
- `Статус попытки`
- `Результат разговора`
- `Проверка ограничений`
- `Запись / расшифровка`
- `Время начала`
- `Длительность`
- `Кампания`
- `Требует проверки`

Важно:

- `Статус попытки` и `Результат разговора` должны быть рядом, но не сливаться;
- если причина критична, показывать `status + reason`;
- отсутствие записи/транскрипта должно быть видимым как risk-state, а не только внутри карточки.

## 8.3. Что показывать в карточке звонка

Карточка звонка должна отвечать:

1. Что произошло технически?
2. Был ли разговор и чем он закончился?
3. Есть ли запись и расшифровка?
4. Прошел ли звонок через допустимый compliance-flow?
5. Нужна ли ручная проверка?
6. Есть ли расхождения с данными провайдера?

Рекомендуемая структура:

- header:
  - `Статус попытки`
  - `Результат разговора`
  - `Требует проверки` / `Приостановлено системой`, если актуально
- блок `Ход звонка`
  - timeline: `queued`, `ringing`, `answered`, `completed`, `transferred`, ...
- блок `Запись и расшифровка`
  - `Запись хранится` / `Записи нет`
  - `Расшифровка готова` / `Расшифровка еще обрабатывается` / `Расшифровку получить не удалось`
- блок `Проверка перед звонком`
  - итог compliance decision
  - причина и `ruleVersion`
- блок `Техническая диагностика`
  - поставщик
  - внешний ID
  - raw SIP/CDR status
  - mismatch flags

## 8.4. Рекомендуемая словарная модель для UI

Технические статусы:

- `created` -> `Подготовка`
- `queued` -> `В очереди`
- `dialing` -> `Набор`
- `ringing` -> `Идет вызов`
- `answered` -> `Соединение установлено`
- `in_conversation` -> `Идет разговор`
- `transferred_to_handoff` -> `Переведен оператору`
- `completed` -> `Завершен`
- `no_answer` -> `Нет ответа`
- `busy` -> `Занято`
- `voicemail` -> `Голосовая почта`
- `failed` -> `Ошибка звонка`
- `blocked` -> `Звонок заблокирован`
- `cancelled` -> `Отменен`
- `unknown` -> `Статус уточняется`

Статусы evidence:

- `awaiting_recording` -> `Ожидаем запись`
- `awaiting_transcription` -> `Расшифровка в обработке`
- `transcribed` -> `Расшифровка готова`
- `transcription_failed` -> `Расшифровку получить не удалось`
- `recording_missing` -> `Записи нет`
- `review_required` -> `Требует проверки`

## 9. Хранение в базе

## 9.1. Принцип

В базе должны храниться отдельно:

1. конфигурация подключения;
2. попытка звонка;
3. поток событий звонка;
4. итог разговора;
5. evidence-артефакты;
6. транскрипция;
7. reconciliation и mismatch-сигналы.

Текущих `CallAttempt` и `CallResult` недостаточно для детальной live-интеграции без event/history слоя.

## 9.2. Рекомендуемые сущности

### TelephonyConnection

Оставить как tenant-scoped сущность, дополнить полями:

- `connectionType`: `sip_trunk` | `provider_api` | `hybrid`
- `transportProfile`: `webhook`, `polling`, `cdr_batch`, `hybrid`
- `capabilityStatus`: `pending`, `verified`, `failed`
- `providerDeclaredCapacity`: integer nullable
- `platformApprovedCapacity`: integer nullable
- `statusCallbackUrlConfigured`: boolean
- `supportsRealtimeEvents`: boolean
- `supportsCdr`: boolean
- `supportsRecording`: boolean
- `supportsAudioExportForTranscription`: boolean
- `supportsHandoff`: boolean
- `supportsMarking`: boolean
- `lastHealthcheckAt`
- `lastHealthcheckStatus`

Секреты и SIP credentials в plain text здесь не хранить.

### CallAttempt

Расширить:

- `orchestrationStatus`
- `dialStatus`
- `providerStatusRaw`
- `providerStatusUpdatedAt`
- `lastEventAt`
- `direction` (`outbound` для v1, с запасом)
- `answeredAt`
- `hangupAt`
- `failureReasonCode`
- `failureReasonText`
- `disconnectInitiator` (`system`, `provider`, `callee`, `agent`, `operator`, `unknown`)
- `attemptSequence`
- `isTestCall`
- `reviewRequired`
- `reviewReasonCode`
- `cdrReconciliationStatus`

Если не хочется ломать текущий контракт, `status` может остаться canonical summary полем, а detail-поля можно добавить рядом.

### CallResult

Оставить как слой business outcome, дополнить:

- `conversationStatus`
- `transcriptStatus`
- `recordingStatus`
- `recordingDurationSec`
- `talkDurationSec`
- `silenceDurationSec` nullable
- `transcriptId` nullable
- `recordingAssetId` nullable
- `outcomeSource` (`system`, `llm`, `human`, `provider`)
- `outcomeConfirmedByUserId` nullable
- `outcomeConfirmedAt` nullable

### Новая сущность: CallEvent

Минимальная структура:

- `id`
- `tenantId`
- `callAttemptId`
- `eventType`
- `eventSource` (`platform`, `provider_webhook`, `provider_poll`, `cdr`, `manual_review`)
- `normalizedStatus` nullable
- `rawStatus` nullable
- `payloadRef` nullable
- `occurredAt`
- `receivedAt`
- `isTerminal`
- `metadata` JSON

Назначение:

- timeline звонка;
- отладка интеграции;
- повторная реконструкция состояния;
- источники для reconciliation и SLA.

### Новая сущность: CallTranscript

Структура:

- `id`
- `tenantId`
- `callAttemptId`
- `status` (`pending`, `processing`, `ready`, `failed`)
- `provider` / `engine`
- `language`
- `version`
- `storageUrl` или `objectKey`
- `summary` nullable
- `confidenceSummary` nullable
- `createdAt`
- `updatedAt`

Опционально отдельно хранить сегменты.

### Новая сущность: CallTranscriptSegment

- `id`
- `transcriptId`
- `speaker` (`agent`, `customer`, `operator`, `unknown`)
- `startedAtMs`
- `endedAtMs`
- `text`
- `confidence` nullable
- `channel` nullable
- `sequence`

### Новая сущность: CallRecordingAsset

- `id`
- `tenantId`
- `callAttemptId`
- `status` (`pending`, `ready`, `failed`, `missing`)
- `storageUrl` или `objectKey`
- `durationSec`
- `format`
- `checksum`
- `createdAt`

### Новая сущность: CallReconciliationIssue

- `id`
- `tenantId`
- `callAttemptId`
- `providerCallId`
- `issueType` (`missing_attempt`, `missing_cdr`, `status_mismatch`, `recording_mismatch`, `duration_mismatch`)
- `severity`
- `providerValue`
- `platformValue`
- `detectedAt`
- `resolvedAt` nullable
- `resolution` nullable

## 9.3. Где хранить сам текст транскрипта

Рекомендуемая модель:

- метаданные транскрипта в PostgreSQL;
- полный текст:
  - либо в PostgreSQL, если объем пилота небольшой и нужен быстрый полнотекстовый поиск;
  - либо в object storage в РФ, а в БД только `objectKey`, если ожидаются длинные разговоры и тяжелые payload.

Практичный pilot-компромисс:

- summary + индексируемые поля в БД;
- полный transcript JSON/segments в object storage;
- в БД `transcriptStatus`, `transcriptId`, `searchPreview`, `hasPiiMarkers`, `language`.

## 9.4. Как связывать транскрипцию со звонком

Связь должна идти так:

- `CallAttempt` — первичный объект попытки;
- `CallResult` — агрегированный итог;
- `CallTranscript` — evidence-артефакт разговора;
- `CallRecordingAsset` — audio evidence;
- `CallEvent` — timeline и источник восстановления статусов.

Не нужно хранить `transcriptUrl` как единственный атрибут результата звонка. Для live этого недостаточно.

## 10. Поведение при деградации

Система должна быть fail-closed для live.

### Сценарии

1. SIP-клиент не отдает terminal status
   - статус `unknown`
   - запускается polling/CDR reconciliation
   - при пороге таких кейсов — `provider_sla_failed`

2. answered call без записи
   - `conversationStatus=recording_missing`
   - событие `recording_failed`
   - возможная автопауза

3. запись есть, транскрипт не получен
   - `transcriptStatus=failed`
   - не ломает исторический факт звонка, но создает review/risk signal

4. raw CDR противоречит нашему финальному статусу
   - создается reconciliation issue
   - usage/reporting строятся только после policy разрешения конфликта

5. handoff queue недоступна
   - новые live-звонки не стартуют
   - активный звонок завершается безопасно без продолжения взыскания

## 11. Изменения в API и UI

## 11.1. API

Потребуются:

- webhook ingestion endpoint для SIP/provider событий;
- endpoint/worker для polling статусов;
- endpoint/worker для CDR reconciliation;
- расширение `GET .../calls` и `GET .../calls/:callAttemptId`;
- отдельный evidence/timeline блок в карточке звонка;
- health/probe API для валидации client SIP connection.

## 11.2. UI: раздел "Телефония"

Для подключения SIP клиента нужно показывать:

- тип подключения;
- статус подключения;
- capability checklist:
  - маркировка
  - запись
  - аудио для расшифровки
  - перевод оператору
  - webhook/callback
  - CDR
- заявленную емкость;
- разрешенный лимит пилота;
- дату последней проверки;
- проблемы подключения;
- CTA `Проверить подключение`.

## 11.3. UI: мониторинг кампании

На экране кампании нужно явно показывать:

- сколько звонков сейчас активно;
- какой лимит одновременных звонков разрешен;
- есть ли перегрузка handoff;
- есть ли всплеск ошибок провайдера;
- есть ли звонки без записи/расшифровки;
- есть ли mismatch между нашими статусами и CDR.

Это должно жить выше сырых KPI, если есть risk.

## 12. Ответы на исходные вопросы

### 1. Как интегрироваться с SIP-телефонией?

Через tenant-scoped `TelephonyConnection` + отдельный `SipVoiceProviderAdapter` с capability contract, webhook/poll/CDR ingress, нормализацию статусов и обязательный readiness probe.

### 2. Кто управляет нагрузкой?

Клиент управляет инфраструктурной емкостью SIP-контура. Мы управляем безопасной интенсивностью запуска и stop-conditions. Итоговый concurrency limit вычисляется как минимум из клиентской capacity и наших safety limits.

### 3. Как возвращать статусы звонков?

Не одним полем. Нужно возвращать минимум:

- технический статус попытки;
- статус evidence pipeline;
- бизнес-исход;
- compliance status;
- источник и время последнего статуса провайдера.

### 4. Какие статусы нужны и как их показывать?

Нужны отдельные слои статусов:

- dial/attempt statuses;
- transcript/recording statuses;
- business outcomes;
- review/risk states.

В UI это показывается через раздельные поля `Статус попытки`, `Результат разговора`, `Запись/расшифровка`, `Требует проверки`.

### 5. Как хранить это в базе вместе с транскрибацией?

Не только в `CallResult`. Нужны:

- `CallAttempt`
- `CallResult`
- `CallEvent`
- `CallTranscript`
- `CallTranscriptSegment`
- `CallRecordingAsset`
- `CallReconciliationIssue`

## 13. Вопросы к бизнесу и юристам

## 13.1. Продукт / операции

1. Мы поддерживаем только один SIP-контур на tenant или несколько подключений с маршрутизацией по кампаниям?
2. Разрешаем ли разные telephony connections для разных кампаний одного клиента одновременно?
3. Нужен ли self-service onboarding SIP или только managed onboarding через integration admin?
4. Что считать минимальным supported profile: webhook-only, polling-only, CDR batch, hybrid?
5. Можно ли запускать пилот, если у клиента нет online webhook, но есть только задержанный CDR?
6. Нужен ли failover на второй connection внутри tenant в pilot или только в scale phase?
7. Должен ли клиент сам задавать лимит линий в интерфейсе или он фиксируется при onboarding и редактируется только админом?
8. Нужны ли разные лимиты concurrency на tenant, campaign и connection?
9. Нужно ли автоматически снижать concurrency при росте `busy`/`failed`, или только автопауза и ручное решение?
10. Хотим ли мы считать `voicemail` допустимым завершением пилота или это всегда нежелательный исход?

## 13.2. Compliance / legal

11. Что считается состоявшимся контактом для лимитов 1/2/8: `ringing`, `answered`, `voicemail`, `busy`, `transferred`?
12. Можно ли использовать клиентский SIP-контур, если маркировка реализована у клиента вне нашего прямого API-контроля?
13. Как мы подтверждаем `R-MARKING`: probe, договор, тестовый звонок, screenshot/операторское подтверждение, сочетание?
14. Что считать достаточным evidence выполнения маркировки?
15. Допустимо ли продолжать pilot, если запись приходит с задержкой, а не синхронно?
16. Какой срок хранения записи и транскрипта должен применяться в pilot до formal legal memo?
17. Можно ли хранить полный transcript в БД, или он должен быть только в защищенном объектном хранилище?
18. Какие роли имеют право видеть запись, расшифровку и raw provider diagnostics?

## 13.3. Бизнес-логика звонка

19. Какие финальные business outcomes обязательны уже в pilot, а какие можно отложить?
20. Нужен ли статус "дозвон состоялся, но разговор невалиден" отдельно от `answered`?
21. Нужно ли отличать `перевод оператору запрошен` от `перевод завершен` в отчетности?
22. Что делать, если операторская очередь недоступна вне рабочих часов?
23. Какой SLA допустим для появления записи и транскрипта после завершения звонка?
24. Какой процент answered calls без transcript/recording допустим до автопаузы?

## 13.4. Отчетность / финансы

25. На каком статусе считать usage/billing event: при `queued`, `ringing`, `answered` или terminal CDR?
26. Нужна ли отдельная тарификация за attempt, answered call, transcript, handoff?
27. Какой источник истины для отчетов при конфликте наших статусов и CDR провайдера?
28. Нужен ли пользовательский экран сверки CDR mismatch или достаточно внутренней admin-очереди?

## 14. Решения, которые можно принять уже сейчас

Без дополнительных ответов от бизнеса можно уже зафиксировать:

1. Свой SIP-стек не строим.
2. BYO SIP допустим только через capability contract и readiness probe.
3. Клиент не является источником истины по safe concurrency; он задает только одну из границ.
4. `CallAttempt.status` и `CallResult.outcome` остаются разными слоями.
5. Для live нужен event/evidence слой, а не только итоговый `CallResult`.
6. Отсутствие записи/транскрипта у answered live-call — risk signal, а не "обычная техническая ошибка".
7. Нормализованные продуктовые статусы не должны зависеть от raw SIP codes.

## 15. Следующие шаги

1. Утвердить supported integration profiles для BYO SIP.
2. Утвердить status model и ownership нагрузочных лимитов.
3. Согласовать с бизнесом и юристами open questions из раздела 13.
4. После утверждения — подготовить implementation plan по миграциям, API, event-ingestion, UI журнала звонков и readiness/probe потоку.
