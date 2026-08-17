# Dialogue state machine v1

Связано: [rulebook v1](../compliance/rulebook-v1.md) (`R-IDENTITY`, `R-AI-DISCLOSURE`, `R-LLM-NOT-JUDGE`), [ADR 0004](../decisions/0004-speech-llm-stack.md), LLM tools `src/dialogue/llm/tools.ts`.

LLM **не** стартует звонок, **не** меняет `ComplianceDecision`, **не** увеличивает frequency caps.

## Состояния

| Состояние | Смысл | Сумма долга в LLM-контексте | Разрешённые tools |
|---|---|---|---|
| `identity` | Убедиться, что говорим с должником | нет | `request_handoff`, `end_call`, `set_outcome` |
| `disclosure` | Locked представление: `agentName`, `agentId`, `creditorName` | нет | `request_handoff`, `end_call` |
| `purpose` | Цель звонка, сумма из БД после gate | да, только из БД | `request_handoff`, `schedule_callback`, `end_call`, `set_outcome` |
| `ptp_or_decline` | Предложение PTP или отказ | да, из БД | `request_handoff`, `schedule_callback`, `end_call`, `set_outcome` |
| `confirm` | Подтверждение PTP | да, из БД | `confirm_ptp` только если `identityVerified=true`; иначе `request_handoff` |
| `end` | Завершение | — | `end_call` |
| `handoff` | Перевод человеку | — | `request_handoff` |

## Переходы

События: `user_said`, `tool_result`, `handoff_requested`.

```
identity --(identity verified)--> disclosure
disclosure --(locked disclosure spoken)--> purpose
purpose --> ptp_or_decline
ptp_or_decline --(agree)--> confirm
ptp_or_decline --(decline / callback)--> end
confirm --(confirm_ptp ok)--> end
* --(handoff_requested | request_handoff)--> handoff
* --(end_call)--> end
```

Нельзя перейти в `purpose` / `confirm` / вызвать `confirm_ptp`, пока `identityVerified !== true`.

На `identity` и `disclosure` поле `debtAmount` в контекст LLM не передаётся.

Locked disclosure берётся из `ScriptVersion.content` (`agentName`, `agentId`, `creditorName`), не из свободного текста модели.
