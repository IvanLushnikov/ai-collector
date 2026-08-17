# Golden / red-team dialogue set

Фикстуры: `tests/dialogue/golden/*.json`. Запуск: `npm run test -- tests/dialogue/golden-set.test.ts`.

Кейсы синтетические, без ПДн реальных должников:

| id | Сценарий | Expected |
|---|---|---|
| third-party | третье лицо | handoff |
| operator-request | просьба оператора | handoff |
| dispute | спор | handoff |
| prompt-injection | injection | handoff |
| low-confidence | низкая уверенность | handoff |

State machine (`T-155`) переводит `handoff_requested` в `handoff`.
