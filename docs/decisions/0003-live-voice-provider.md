# Decision: Live voice provider for Controlled Pilot

Дата: 17.08.2026  
Статус: принято как архитектурное направление; коммерческий договор с вендором ещё не подписан  
Связанные документы: [0001 backend](./0001-backend-stack.md), [voice adapter](../integrations/voice-provider-adapter.md), [rulebook v1](../compliance/rulebook-v1.md), [карта технологий](../architecture/2026-08-17-technology-map.md), [PRD](../product/prd-draft.md)

## Решение

1. **Свой SIP-стек не строим.** Исходящий live-канал — один CPaaS/оператор за уже существующим `VoiceProviderAdapter`.
2. **Диалоговый «робот» вендора не является мозгом продукта.** Exolve Robots, Mango voice robot и аналоги не заменяют наш compliance engine, state machine, frequency ledger и audit.
3. **Для Controlled Pilot — ровно один боевой провайдер.** Второй провайдер и failover — этап Scale; точка расширения уже описана в адаптере.
4. **Целевой провайдер пилота: МТС Exolve (Voice API / SIP), не пакет Robots.** Запасной путь, если Exolve не проходит маркировку, transfer, DPA или коммерцию: **Mango Office / Mangotelecom**.
5. **Sandbox остаётся обязательным** для тестов и локальной разработки. Live mode включается только при `legalBasisStatus=confirmed` по [rulebook R-AUTO-DIAL-BASIS](../compliance/rulebook-v1.md).
6. Секреты провайдера — в secret store / env, не в `TelephonyConnection`.

Это направление, а не факт «договор уже с Exolve». Смена на Mango не должна ломать оркестратор — только модуль `src/telephony/{provider}`.

## Рассмотренные варианты

### A. Exolve Voice API + наш оркестратор (принято)

Плюсы: уже в кабинете как основной контур; российский операторский периметр МТС; Voice API/SIP заявлены; маркировка обсуждается как договорной контур; меньше соблазна отдать compliance вендору.

Минусы: пакет Robots может выглядеть «быстрее»; запись, маркировка, transfer и CDR нужно проверить тестом, а не сайтом; отдельная тарификация ASR/TTS/хранения.

### B. Mango Office / Mangotelecom как первый live (запасной)

Плюсы: партнёр назван в PRD; контакт-центр и перевод на оператора — родной сценарий; SIP.

Минусы: отдельный телеком-контур и робот с NLU; выше риск смешать наш сценарий с их ботом; маркировку всё равно проверять.

Выбирать Mango первым, если: Exolve не даёт обязательный transfer+recording+marking в одном пилотном договоре, либо коммерция/DPA не сходятся.

### C. Полный voice robot вендора как продукт (отклонён)

Плюсы: быстрее «позвонить».

Минусы: нельзя гарантировать pre-dial compliance, identity gate, 1/2/8 на уровне кредитора, неизменяемый audit наших правил, fail-closed без записи. Противоречит позиционированию и rulebook.

### D. Собственная АТС / Asterisk (отклонён для пилота)

Имеет смысл только как enterprise/on-prem контур клиента, не как MVP.

## Обязательный контракт провайдера

Пока пункт не подтверждён тестом и договором, live readiness = block.

| Сигнал | Зачем |
|---|---|
| Старт / статус / hangup по `providerCallId` | текущий adapter |
| Нормализация статусов в `VoiceCallStatus` | без vendor-полей в домене |
| Запись разговора, доступная нам | R-RECORDING, автопауза |
| Перевод на номер/очередь клиента | R-HANDOFF |
| Маркировка / отображение инициатора | R-MARKING, 126‑ФЗ / ПП №1300 |
| CDR для сверки с usage | биллинг и отчёт |
| AMD / voicemail как отдельный статус | не считать диалогом |
| Webhook/callback с идемпотентностью | оркестратор |
| Обработка ПДн в РФ + поручение | 152‑ФЗ |
| Запрет использовать их LLM/робот как скрытый диалог | R-LLM-NOT-JUDGE |

Не хранить в домене `callSid`, регион вендора, raw payload. Диагностика — в audit sink.

## Как это стыкуется с продуктом

- `TelephonyConnection.mode=sandbox|production`. Production нельзя выбрать, пока не пройден probe маркировки и legal basis tenant.
- Кампания ссылается на одно соединение. Смена провайдера на running-кампании запрещена (новая версия / review).
- Concurrent lines — `campaign-config`, не шире квоты провайдера и не обход compliance.
- Тестовые звонки на номера команды не пишутся в frequency ledger должников.

## Что не решает этот ADR

- Выбор ASR/TTS/LLM — [0004](./0004-speech-llm-stack.md).
- Юридическое основание автовызовов — rulebook, пакет юристу.
- Тариф и unit economics — после КП; публичные цены конкурентов не считать COGS.

## Следующие шаги (не код этого ADR)

1. Запросить у Exolve и, параллельно как backup, у Mango: маркировка, recording, transfer, CDR, DPA, регион хранения, антиспам.
2. Стенд: один тестовый номер → sandbox adapter остаётся, добавляется live adapter за feature-flag.
3. Readiness: `telephonyProbeResult` обязан включать marking+recording+handoff, не только «SIP 200».
4. Не включать `production` в UI клиента до legal memo.
