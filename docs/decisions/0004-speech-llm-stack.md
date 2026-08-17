# Decision: ASR, TTS, LLM and prompt runtime for Controlled Pilot

Дата: 17.08.2026  
Статус: принято как архитектурное направление; вендорные договоры и замеры качества ещё впереди  
Связанные документы: [0003 live voice](./0003-live-voice-provider.md), [rulebook v1](../compliance/rulebook-v1.md), [карта технологий](../architecture/2026-08-17-technology-map.md), [PRD](../product/prd-draft.md)

## Решение

1. **Диалоговый runtime наш:** state machine + allowlisted tools + versioned prompts. LLM не маршрутизирует политику и не стартует звонок.
2. **ASR, TTS и LLM — отдельные адаптеры**, как телефония. Смена вендора не меняет compliance engine и домен `CallAttempt`.
3. **Персональные данные должника не уходят в иностранный cloud** (OpenAI, Anthropic, Google, Deepgram и аналоги) на live и на любых реальных базах.
4. **Целевой состав пилота МФО:**
   - ASR/TTS: **Yandex SpeechKit** (РФ);
   - LLM: **YandexGPT в Yandex Cloud**;
   - запасной LLM/on-prem путь: **GigaChat**.
5. **Голос вендора телефонии не заменяет SpeechKit по умолчанию.** Их ASR/TTS можно рассматривать только если есть DPA, хранение в РФ, timestamps/confidence и WER не хуже выбранного контура на нашем корпусе.
6. **Voice biometrics / voiceprint запрещены в v1.**
7. Промпты юридически значимых фраз (disclosure, отказ третьему лицу, handoff) — locked templates в prompt registry, не свободное редактирование менеджером.

Sandbox MVP Lab может жить без боевого ASR/TTS/LLM (заглушки и текстовый тестовый диалог).

## Рассмотренные варианты

### A. Своя state machine + SpeechKit + YandexGPT (принято)

Плюсы: один российский облачный периметр вместе с будущим хостингом; адаптеры; минимизация ПДн контролируется нами; не смешивается с роботом CPaaS.

Минусы: больше стыков и latency hops (telephony → ASR → LLM → TTS → telephony); качество на collection corpus не доказано — это gate, не обещание.

### B. Всё у телеком-вендора (робот Exolve/Mango) (отклонён как core)

Плюсы: меньше интеграций.

Минусы: нельзя гарантировать R-IDENTITY, R-LLM-NOT-JUDGE, версию промпта в нашем audit, запрет суммы до верификации.

### C. Self-hosted Whisper + локальная LLM (отложен до банка / on-prem)

Плюсы: ИБ крупного клиента.

Минусы: latency, ops, качество; не нужен МФО-пилоту, если облако РФ проходит ИБ клиента.

## Контракт адаптеров

### ASR

Обязательно: streaming, русский, partials, confidence, word timestamps для extractor, сегментация barge-in.

Низкая уверенность → tool `request_handoff` / не продолжать взыскание. Численный порог не фиксируем в ADR, пока нет замера на корпусе (открытый вопрос PRD).

### TTS

Streaming, стабильный голос кампании, версия голоса в `ScriptVersion`, first audio входит в замеряемый latency budget. Смена голоса на running-кампании — новая версия сценария.

### LLM

- Модель и параметры (`modelId`, температура, max tokens) — в registry рядом с `promptVersion` и `policyVersion`.
- Каждый ход: state id, allowed tools, запрет tool суммы до identity gate.
- Ответ только JSON/tool-call по схеме, не свободная «речь в никуда»: текст для TTS собирается из шаблона шага + разрешённых слотов.
- Red-team и golden set — обязательный gate перед live, не после.

### Prompt registry

Хранить: system/policy/script hashes, кто опубликовал, `ruleVersion` совместимости. Running-кампания ссылается на immutable version. В git — шаблоны и тесты, не единственная правда прод-промпта.

## Поток ПДн

1. Pre-dial: ПДн только в PostgreSQL и compliance engine. В LLM не идут.
2. Identity: в ASR/LLM — аудио и реплики без `debtAmount`.
3. После gate: сумма и дата как поля из БД в tool, не как «модель вспомнила».
4. Аудио и транскрипт — object storage в РФ, доступ по роли. Прослушивание в UI v1 не обещаем, хранение evidence — да.
5. Субподрядчики SpeechKit/YandexGPT/GigaChat вписываются в поручение на обработку. Смена модели — юридическое событие.

## Latency

Не фиксируем выдуманный SLA. Обязаны мерить end-to-end turn: telephony → ASR partial → policy/tool → LLM → TTS first audio (p50/p95) и долю перебиваний. «Низкая задержка» без этих цифр на реальных записях не является аргументом выбора вендора.

Если SpeechKit не укладывается в приемлемый для пилота turn-time на стенде — сначала оптимизация стрима и размера контекста, затем оценка ASR провайдера телефонии по тому же контракту, не отказ от своей state machine.

## Что не входит

- RAG по договорам и «свободный коллектор».
- Мультиязычность.
- On-prem speech как обязательный контур МФО-пилота.
- Успех пилота по WER «на глаз».

## Следующие шаги

1. Договор/DPA Yandex Cloud (SpeechKit + YandexGPT) и оценка GigaChat как backup.
2. Обезличенный корпус и golden/red-team набор до подключения live LLM.
3. Интерфейсы `src/speech/asr`, `src/speech/tts`, `src/dialogue/llm` по аналогии с `VoiceProviderAdapter` — отдельными 1 SP задачами, не в этом ADR. Ключи tenant vs platform — [0005](./0005-byok-speech-llm.md).
4. Live LLM только после rulebook gates: disclosure, identity, handoff, localization.
