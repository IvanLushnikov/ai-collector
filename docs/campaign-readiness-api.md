# Campaign Readiness API (MVP)

Документ описывает route-level контракт для сводной проверки готовности кампании к запуску.

## Принципы

- Tenant isolation обязателен: endpoint доступен только для запрошенного `tenantId`.
- Для готовности проверяются tenant-scoped сущности:
  - `DebtorRecord`
  - `ScriptVersion`
  - `TelephonyConnection`
  - `ComplianceDecision`
- Причины блокировок возвращаются в понятном формате, пригодном для `readiness`-дашборда и UI.

## Общие ошибки

- `VALIDATION_ERROR` — ошибка валидации параметров пути.
- `TENANT_NOT_FOUND` — tenant не найден.
- `CAMPAIGN_NOT_FOUND` — кампания не существует или не принадлежит tenant.
- `USER_ROLE_MISSING` — отсутствует обязательный `X-User-Role`.
- `FORBIDDEN` — роль не имеет доступа к readiness-summary API.

## RBAC

Для доступа к `GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary` необходим заголовок `X-User-Role` со значением:

- `owner`
- `collection_manager`
- `operator`
- `qa_analyst`
- `compliance_officer`
- `integration_admin`

### GET: сводный readiness-summary кампании

`GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary`

#### Параметры пути

- `tenantId` (`string`, UUID)
- `campaignId` (`string`, не пустой)

#### Успешный ответ `200`

```json
{
  "campaignId": "uuid",
  "campaignStatus": "review",
  "source": "campaign-readiness-v1",
  "timestamp": "2026-08-16T10:00:00.000Z",
  "readinessHash": "campaign-1|100|1|1|0|1692182400000|1692182400000",
  "readinessState": "ready",
  "blocked": false,
  "stale": false,
  "reasons": [],
  "complianceReasons": [
    {
      "id": "uuid",
      "reasonCode": "DEBT_STATUS_BLOCK",
      "reasonText": "Debt status blocks call",
      "checkedAt": "2026-08-16T10:00:00.000Z"
    }
  ]
}
```

- `reasons` — массив объектов с причинами, которые блокируют или поясняют статус запуска:
  - `source` (`debtors` | `script` | `telephony` | `compliance` | `campaign` | `legal` | `speech`)
  - `reasonCode` (`DEBTORS_MISSING`, `SCRIPT_NOT_READY`, `PRODUCTION_TELEPHONY_MISSING`, `TELEPHONY_PROBE_INCOMPLETE`, `HANDOFF_UNAVAILABLE_BLOCK`, `LEGAL_BASIS_NOT_CONFIRMED`, `SPEECH_CREDENTIALS_NOT_READY`, `COMPLIANCE_BLOCKS_DETECTED`, `CAMPAIGN_STATUS_INVALID`)
  - `reasonText` (`string`)
  - `nextAction` (`string`)

- `TELEPHONY_PROBE_INCOMPLETE` — для `TelephonyConnection.mode=production`: нет `lastProbeAt` или probe не подтвердил сразу `marking`, `recording` и `handoff`. `sandboxPass` не считается live-маркировкой. Sandbox-соединение этот код не получает.

- `SPEECH_CREDENTIALS_NOT_READY` — для production-ready: нет `status=active` BYOK и нет platform env на `asr`/`tts`/`llm`. Sandbox/fake канал этот код не получает.

- `HANDOFF_UNAVAILABLE_BLOCK` — для production-соединения нет номера/SIP очереди оператора. Sandbox без очереди допустим.

- `complianceReasons` — список последних блокирующих записей `ComplianceDecision` в порядке `checkedAt desc`.
- `readinessState` — `ready`/`blocked`/`stale`.
- `stale` становится `true`, если скрипты или telephony конфигурация обновлялись позже, чем кампания.

#### Ответы с ошибками

- `400` — `VALIDATION_ERROR`
- `404` — `TENANT_NOT_FOUND` или `CAMPAIGN_NOT_FOUND`
- `401` — `USER_ROLE_MISSING`
- `403` — `FORBIDDEN`
