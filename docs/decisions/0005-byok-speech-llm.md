# Decision: BYOK for ASR, TTS and LLM

Дата: 17.08.2026  
Статус: принято как направление реализации; Vault/KMS и per-campaign override не входят в v1  
Связанные документы: [спека](../superpowers/specs/2026-08-17-byok-speech-llm-design.md), [0001 backend](./0001-backend-stack.md), [0004 speech/LLM](./0004-speech-llm-stack.md), [rulebook v1](../compliance/rulebook-v1.md), [telephony API](../telephony-api.md)

## Решение

1. Tenant может подключить **свой ключ** (`byok`) отдельно для ASR, TTS и LLM. Это не замена адаптеров и не смена вендора «на любой cloud».
2. Разрешённые провайдеры те же, что в [ADR 0004](./0004-speech-llm-stack.md): SpeechKit, YandexGPT, запасной GigaChat. Иностранный cloud для ПДн должника отклоняется на валидации (`PROVIDER_NOT_ALLOWED`).
3. Если tenant не задал свой ключ, адаптер берёт **ключ платформы** из env. Sandbox/fake-адаптеры ключей не требуют.
4. Секрет не лежит в `ProviderCredential` и не возвращается API. Ciphertext хранится в отдельной таблице, шифрование AES-256-GCM ключом платформы `CREDENTIALS_ENCRYPTION_KEY`.
5. Live/production-звонок **fail-closed**, если для нужного capability нет ни активного BYOK, ни настроенного platform env. Тестовый sandbox с fake-адаптером не блокируется.
6. Потребление ASR/TTS/LLM при `byok` пишется в usage ledger с `credentialMode=byok` и **не входит** в platform invoice speech-единиц.

## Почему так

- МФО и банк хотят свой договор/квоту Yandex или GigaChat, а не общий ключ SaaS.
- Паттерн уже есть у телефонии: метаданные в домене, секрет вне модели. BYOK добавляет только tenant-scoped ciphertext, потому что env на процесс не изолирует арендаторов.
- Смена вендора по-прежнему идёт через адаптер (`src/speech/*`, `src/dialogue/llm/*`), а не через свободный base URL.

## Что не входит в v1

- Несколько активных ключей на один capability и привязка к кампании.
- Vault / Yandex Lockbox / CMEK.
- BYOK телефонии (остаётся `TelephonyConnection` + env).
- On-prem endpoint как «свой ключ» (это отдельный адаптер, этап Scale).
- Показ полного ключа после сохранения.

## Следующий шаг

Реализация — задачи `T-162`–`T-183` в `TECH_BACKLOG_1SP.md`. Детали контрактов — в [спеке](../superpowers/specs/2026-08-17-byok-speech-llm-design.md).
