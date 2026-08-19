# SIP Telephony Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Внедрить в AI Collector pilot-ready контур SIP/BYO-telephony: статусную state model звонка, event/evidence-хранение, webhook/CDR ingestion, расширенный API звонков и UI журнала звонков/карточки разговора.

**Architecture:** Реализация идет поверх существующего `CallAttempt`/`CallResult` и `VoiceProviderAdapter`, без построения собственного SIP-стека. Сначала вводится каноническая state model и новые evidence-сущности, затем ingestion событий и reconciliation, после чего API и `prototype.html` начинают показывать раздельные слои статусов: технический ход звонка, evidence, outcome и review/risk.

**Tech Stack:** Node 20, TypeScript, Fastify, Prisma, PostgreSQL 16, Vitest, статический `prototype.html`.

**Spec:** `docs/superpowers/specs/2026-08-19-sip-telephony-integration-design.md`

## Global Constraints

- Свой SIP-стек не строим.
- BYO SIP допустим только через capability contract и readiness probe.
- Клиент не является источником истины по safe concurrency; он задает только одну из границ.
- `CallAttempt.status` и `CallResult.outcome` остаются разными слоями.
- Для live нужен event/evidence слой, а не только итоговый `CallResult`.
- Отсутствие записи/транскрипта у answered live-call — risk signal, а не обычная техническая ошибка.
- Нормализованные продуктовые статусы не должны зависеть от raw SIP codes.
- Tenant isolation и audit trail обязательны.
- Секреты и SIP credentials в plain text не храним в `TelephonyConnection`.

## Scope Check

Спека покрывает связанные, но зависимые подсистемы: status model, БД/evidence, ingestion, API и UI журнала звонков. Их можно реализовывать в одном плане, потому что каждая следующая часть напрямую зависит от предыдущей, а рабочий результат нужен сквозной: webhook без новых сущностей и новых DTO не дает пользователю ценности.

## File Structure

- `src/domain/call-lifecycle/index.ts` — каноническая dial/evidence state model и pure-функции переходов.
- `src/domain/call-attempt/index.ts` — summary-тип попытки и backward-compatible contract с новым dial layer.
- `src/domain/call-result/index.ts` — outcome/evidence статусы и helper-валидация.
- `src/domain/telephony-connection/index.ts` — capability/capacity snapshot, approved capacity, health flags.
- `src/db/prisma/schema.prisma` — новые enum/model поля и relation graph.
- `src/db/migrations/0025_*` — SQL для новых evidence/event таблиц и расширения `TelephonyConnection`, `CallAttempt`, `CallResult`.
- `src/routes/calls.ts` — enriched list/detail DTO, live guard hooks, query filters по новым статусам.
- `src/routes/telephony.ts` — расширение connection DTO capability/capacity полями.
- `src/routes/telephony-webhooks.ts` — новый HTTP ingress webhook/provider event path.
- `src/server/app.ts` — регистрация webhook route.
- `src/telephony/events/*` — ingestion, idempotency, mapping payload -> normalized event, lifecycle update.
- `src/telephony/cdr-reconciliation.ts` — расширение mismatch модели до persistent issue contract.
- `src/calls/evidence-guard.ts` — переход с URL-only проверки на recording/transcript status.
- `tests/telephony/*.test.ts` — webhook/CDR ingestion, mapper, reconciliation.
- `tests/calls/*.test.ts` — enriched API response и filters.
- `tests/domain-*.test.ts` — status model / lifecycle transition tests.
- `prototype.html` — журнал звонков, карточка разговора, badges evidence/review.
- `tests/prototype-calls-journal.test.ts`, `tests/prototype-call-card.test.ts` — UI regression coverage.

---

### Task 1: Ввести каноническую state model звонка

**Files:**
- Create: `src/domain/call-lifecycle/index.ts`
- Modify: `src/domain/call-attempt/index.ts`
- Modify: `src/domain/call-result/index.ts`
- Test: `tests/domain-call-lifecycle.test.ts`

**Interfaces:**
- Consumes: `VoiceCallStatus` from `src/telephony/voice-provider/adapter.ts`
- Produces:
  - `type CallDialStatus = 'created' | 'queued' | 'dialing' | 'ringing' | 'answered' | 'in_conversation' | 'handoff_requested' | 'transferred_to_handoff' | 'completed' | 'no_answer' | 'busy' | 'voicemail' | 'failed' | 'cancelled' | 'blocked' | 'unknown'`
  - `type TranscriptStatus = 'none' | 'pending' | 'processing' | 'ready' | 'failed'`
  - `type RecordingStatus = 'none' | 'pending' | 'ready' | 'failed' | 'missing'`
  - `type ConversationStatus = 'not_started' | 'in_progress' | 'awaiting_recording' | 'awaiting_transcription' | 'transcribed' | 'transcription_failed' | 'recording_missing' | 'review_required' | 'finalized'`
  - `normalizeVoiceStatus(status: VoiceCallStatus): CallDialStatus`
  - `deriveConversationStatus(input: { dialStatus: CallDialStatus; recordingStatus: RecordingStatus; transcriptStatus: TranscriptStatus; reviewRequired: boolean; }): ConversationStatus`
  - `summarizeAttemptStatus(input: { dialStatus: CallDialStatus; }): import('../call-attempt/index.js').CallAttemptStatus`

- [ ] **Step 1: Написать падающий unit test на нормализацию и evidence-state**

```ts
import { describe, expect, it } from 'vitest';
import {
  normalizeVoiceStatus,
  deriveConversationStatus
} from '../src/domain/call-lifecycle/index.js';

describe('call lifecycle state model', () => {
  it('maps provider statuses into canonical dial statuses', () => {
    expect(normalizeVoiceStatus('queued')).toBe('queued');
    expect(normalizeVoiceStatus('ringing')).toBe('ringing');
    expect(normalizeVoiceStatus('answered')).toBe('answered');
    expect(normalizeVoiceStatus('transferred_to_handoff')).toBe('transferred_to_handoff');
    expect(normalizeVoiceStatus('unknown')).toBe('unknown');
  });

  it('derives evidence status after an answered call without transcript', () => {
    expect(deriveConversationStatus({
      dialStatus: 'completed',
      recordingStatus: 'ready',
      transcriptStatus: 'processing',
      reviewRequired: false
    })).toBe('awaiting_transcription');
  });

  it('marks answered live call without recording as recording_missing', () => {
    expect(deriveConversationStatus({
      dialStatus: 'completed',
      recordingStatus: 'missing',
      transcriptStatus: 'none',
      reviewRequired: false
    })).toBe('recording_missing');
  });
});
```

- [ ] **Step 2: Прогнать test red**

Run: `npm run test -- tests/domain-call-lifecycle.test.ts`

Expected: FAIL with module/type errors because `src/domain/call-lifecycle/index.ts` does not exist yet.

- [ ] **Step 3: Реализовать pure lifecycle helpers**

```ts
import type { VoiceCallStatus } from '../../telephony/voice-provider/adapter.js';
import type { CallAttemptStatus } from '../call-attempt/index.js';

export type CallDialStatus = 'created' | 'queued' | 'dialing' | 'ringing' | 'answered' | 'in_conversation' | 'handoff_requested' | 'transferred_to_handoff' | 'completed' | 'no_answer' | 'busy' | 'voicemail' | 'failed' | 'cancelled' | 'blocked' | 'unknown';
export type TranscriptStatus = 'none' | 'pending' | 'processing' | 'ready' | 'failed';
export type RecordingStatus = 'none' | 'pending' | 'ready' | 'failed' | 'missing';
export type ConversationStatus = 'not_started' | 'in_progress' | 'awaiting_recording' | 'awaiting_transcription' | 'transcribed' | 'transcription_failed' | 'recording_missing' | 'review_required' | 'finalized';

export const normalizeVoiceStatus = (status: VoiceCallStatus): CallDialStatus => {
  switch (status) {
    case 'queued': return 'queued';
    case 'ringing': return 'ringing';
    case 'answered': return 'answered';
    case 'completed': return 'completed';
    case 'no_answer': return 'no_answer';
    case 'voicemail': return 'voicemail';
    case 'busy': return 'busy';
    case 'failed': return 'failed';
    case 'transferred_to_handoff': return 'transferred_to_handoff';
    default: return 'unknown';
  }
};

export const deriveConversationStatus = (input: {
  dialStatus: CallDialStatus;
  recordingStatus: RecordingStatus;
  transcriptStatus: TranscriptStatus;
  reviewRequired: boolean;
}): ConversationStatus => {
  if (input.reviewRequired) return 'review_required';
  if (input.dialStatus === 'answered' || input.dialStatus === 'in_conversation') return 'in_progress';
  if (input.recordingStatus === 'missing') return 'recording_missing';
  if (input.recordingStatus === 'ready' && (input.transcriptStatus === 'pending' || input.transcriptStatus === 'processing')) return 'awaiting_transcription';
  if (input.transcriptStatus === 'failed') return 'transcription_failed';
  if (input.transcriptStatus === 'ready') return 'transcribed';
  return 'finalized';
};

export const summarizeAttemptStatus = (input: { dialStatus: CallDialStatus }): CallAttemptStatus => {
  switch (input.dialStatus) {
    case 'queued': return 'queued';
    case 'ringing': return 'ringing';
    case 'answered':
    case 'in_conversation': return 'answered';
    case 'completed': return 'completed';
    case 'no_answer':
    case 'voicemail': return 'no_answer';
    case 'blocked': return 'blocked';
    case 'busy':
    case 'failed':
    case 'transferred_to_handoff':
    case 'unknown': return 'failed';
    default: return 'initiated';
  }
};
```

- [ ] **Step 4: Расширить доменные типы без ломки текущего summary API**

```ts
// src/domain/call-attempt/index.ts
export interface CallAttempt {
  id: string;
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  telephonyConnectionId: string;
  scriptVersionId?: string | null;
  status: CallAttemptStatus;
  providerCallId: string;
  identityVerified?: boolean;
  identityVerifiedAt?: Date | null;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  dialStatus?: import('../call-lifecycle/index.js').CallDialStatus;
  providerStatusRaw?: string | null;
  providerStatusUpdatedAt?: Date | null;
  reviewRequired?: boolean;
  reviewReasonCode?: string | null;
}

// src/domain/call-result/index.ts
export type TranscriptStatus = import('../call-lifecycle/index.js').TranscriptStatus;
export type RecordingStatus = import('../call-lifecycle/index.js').RecordingStatus;
export type ConversationStatus = import('../call-lifecycle/index.js').ConversationStatus;
```

- [ ] **Step 5: Прогнать green**

Run: `npm run test -- tests/domain-call-lifecycle.test.ts`

Expected: PASS.

---

### Task 2: Добавить evidence/event сущности и миграции Prisma

**Files:**
- Modify: `src/db/prisma/schema.prisma`
- Create: `src/db/migrations/0025_call_event_evidence_statuses/migration.sql`
- Modify: `src/domain/telephony-connection/index.ts`
- Test: `tests/domain-telephony-connection.test.ts`

**Interfaces:**
- Consumes: `CallDialStatus`, `TranscriptStatus`, `RecordingStatus`, `ConversationStatus` from Task 1
- Produces:
  - Prisma fields on `TelephonyConnection`: `connectionType`, `transportProfile`, `capabilityStatus`, `providerDeclaredCapacity`, `platformApprovedCapacity`, `statusCallbackUrlConfigured`, `supportsRealtimeEvents`, `supportsCdr`, `supportsRecording`, `supportsAudioExportForTranscription`, `supportsHandoff`, `supportsMarking`, `lastHealthcheckAt`, `lastHealthcheckStatus`
  - Prisma fields on `CallAttempt`: `dialStatus`, `providerStatusRaw`, `providerStatusUpdatedAt`, `lastEventAt`, `answeredAt`, `hangupAt`, `failureReasonCode`, `failureReasonText`, `disconnectInitiator`, `attemptSequence`, `isTestCall`, `reviewRequired`, `reviewReasonCode`, `cdrReconciliationStatus`
  - Prisma fields on `CallResult`: `conversationStatus`, `transcriptStatus`, `recordingStatus`, `recordingDurationSec`, `talkDurationSec`, `transcriptId`, `recordingAssetId`, `outcomeSource`
  - Prisma models: `CallEvent`, `CallTranscript`, `CallTranscriptSegment`, `CallRecordingAsset`, `CallReconciliationIssue`

- [ ] **Step 1: Написать падающий тест на capacity/probe snapshot connection**

```ts
import { describe, expect, it } from 'vitest';
import { isProductionTelephonyProbeConfirmed } from '../src/domain/telephony-connection/index.js';

describe('telephony connection capacity snapshot', () => {
  it('treats production probe as incomplete without marking, recording and handoff', () => {
    expect(isProductionTelephonyProbeConfirmed({
      mode: 'production',
      lastProbeAt: new Date(),
      probeMarking: true,
      probeRecording: false,
      probeHandoff: true
    })).toBe(false);
  });
});
```

- [ ] **Step 2: Обновить Prisma schema**

```prisma
enum CallConversationStatus {
  not_started
  in_progress
  awaiting_recording
  awaiting_transcription
  transcribed
  transcription_failed
  recording_missing
  review_required
  finalized
}

model CallEvent {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  callAttemptId   String
  callAttempt     CallAttempt @relation(fields: [callAttemptId], references: [id], onDelete: Cascade)
  eventType       String
  eventSource     String
  normalizedStatus String?
  rawStatus       String?
  payloadRef      String?
  occurredAt      DateTime
  receivedAt      DateTime @default(now())
  isTerminal      Boolean   @default(false)
  metadata        Json      @default("{}")

  @@index([tenantId, callAttemptId, occurredAt])
}
```

И аналогично добавить модели `CallTranscript`, `CallTranscriptSegment`, `CallRecordingAsset`, `CallReconciliationIssue` и расширить `TelephonyConnection`, `CallAttempt`, `CallResult`.

- [ ] **Step 3: Написать SQL migration вручную**

```sql
ALTER TABLE "TelephonyConnection" ADD COLUMN "providerDeclaredCapacity" INTEGER;
ALTER TABLE "TelephonyConnection" ADD COLUMN "platformApprovedCapacity" INTEGER;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsRealtimeEvents" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsCdr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsRecording" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsAudioExportForTranscription" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsHandoff" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsMarking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "lastHealthcheckAt" TIMESTAMP(3);
ALTER TABLE "TelephonyConnection" ADD COLUMN "lastHealthcheckStatus" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "dialStatus" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "providerStatusRaw" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "providerStatusUpdatedAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "lastEventAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "answeredAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "hangupAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "reviewRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CallAttempt" ADD COLUMN "reviewReasonCode" TEXT;
ALTER TABLE "CallResult" ADD COLUMN "conversationStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "CallResult" ADD COLUMN "transcriptStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "CallResult" ADD COLUMN "recordingStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "CallResult" ADD COLUMN "talkDurationSec" INTEGER;
ALTER TABLE "CallResult" ADD COLUMN "recordingDurationSec" INTEGER;
ALTER TABLE "CallResult" ADD COLUMN "outcomeSource" TEXT NOT NULL DEFAULT 'system';

CREATE TABLE "CallEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "callAttemptId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventSource" TEXT NOT NULL,
  "normalizedStatus" TEXT,
  "rawStatus" TEXT,
  "payloadRef" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isTerminal" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallTranscript" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "callAttemptId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "provider" TEXT,
  "language" TEXT,
  "version" TEXT,
  "storageUrl" TEXT,
  "summary" TEXT,
  "confidenceSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CallTranscript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallTranscriptSegment" (
  "id" TEXT NOT NULL,
  "transcriptId" TEXT NOT NULL,
  "speaker" TEXT NOT NULL,
  "startedAtMs" INTEGER NOT NULL,
  "endedAtMs" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "channel" TEXT,
  "sequence" INTEGER NOT NULL,
  CONSTRAINT "CallTranscriptSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallRecordingAsset" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "callAttemptId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "storageUrl" TEXT,
  "durationSec" INTEGER,
  "format" TEXT,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CallRecordingAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallReconciliationIssue" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "callAttemptId" TEXT,
  "providerCallId" TEXT NOT NULL,
  "issueType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "providerValue" TEXT,
  "platformValue" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,
  CONSTRAINT "CallReconciliationIssue_pkey" PRIMARY KEY ("id")
);
```

В итоговом SQL обязательно дописать `FOREIGN KEY` и индексы, как минимум:

```sql
CREATE INDEX "CallEvent_tenantId_callAttemptId_occurredAt_idx" ON "CallEvent"("tenantId", "callAttemptId", "occurredAt");
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_callAttemptId_fkey" FOREIGN KEY ("callAttemptId") REFERENCES "CallAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_callAttemptId_key" UNIQUE ("callAttemptId");
ALTER TABLE "CallTranscriptSegment" ADD CONSTRAINT "CallTranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "CallTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallRecordingAsset" ADD CONSTRAINT "CallRecordingAsset_callAttemptId_key" UNIQUE ("callAttemptId");
```

- [ ] **Step 4: Расширить domain snapshot `TelephonyConnection`**

```ts
export interface TelephonyConnection {
  id: string;
  tenantId: string;
  provider: string;
  mode: TelephonyMode;
  status: TelephonyStatus;
  displayName: string;
  providerDeclaredCapacity?: number | null;
  platformApprovedCapacity?: number | null;
  supportsRealtimeEvents?: boolean;
  supportsCdr?: boolean;
  supportsRecording?: boolean;
  supportsAudioExportForTranscription?: boolean;
  supportsHandoff?: boolean;
  supportsMarking?: boolean;
  lastHealthcheckAt?: Date | null;
  lastHealthcheckStatus?: string | null;
}
```

- [ ] **Step 5: Проверить схему**

Run: `npx prisma validate`

Expected: PASS.

- [ ] **Step 6: Проверить unit tests домена**

Run: `npm run test -- tests/domain-telephony-connection.test.ts tests/domain-call-lifecycle.test.ts`

Expected: PASS.

---

### Task 3: Реализовать webhook/provider event ingestion и idempotent lifecycle updates

**Files:**
- Create: `src/routes/telephony-webhooks.ts`
- Create: `src/telephony/events/ingest.ts`
- Create: `src/telephony/events/map-provider-event.ts`
- Modify: `src/server/app.ts`
- Modify: `src/calls/evidence-guard.ts`
- Test: `tests/telephony/webhook-ingestion.api.test.ts`

**Interfaces:**
- Consumes:
  - `normalizeVoiceStatus()` from Task 1
  - Prisma models from Task 2
  - `WebhookInboxEvent` for idempotency
- Produces:
  - `ingestProviderCallEvent(input: { tenantId: string; sourceSystem: string; eventId: string; providerCallId: string; rawStatus: string; occurredAt: Date; payload: Record<string, unknown>; }): Promise<{ callAttemptId: string; dialStatus: CallDialStatus; terminal: boolean; }>`
  - `mapProviderEventStatus(rawStatus: string): CallDialStatus`
  - HTTP route `POST /tenants/:tenantId/telephony/webhooks/:sourceSystem`

- [ ] **Step 1: Написать падающий API test на webhook idempotency**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('telephony webhook ingestion', () => {
  it('stores a provider event once and updates the linked call attempt', async () => {
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => data)
      },
      callAttempt: {
        findFirst: vi.fn(async () => ({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          providerCallId: 'provider-1',
          dialStatus: 'ringing'
        })),
        update: vi.fn(async ({ data }) => Object.assign({ id: 'attempt-1' }, data))
      },
      callEvent: {
        create: vi.fn(async ({ data }) => Object.assign({ id: 'event-1' }, data))
      }
    };

    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      payload: {
        eventId: 'evt-1',
        providerCallId: 'provider-1',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(202);
    expect(store.callEvent.create).toHaveBeenCalledOnce();
    expect(store.callAttempt.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ dialStatus: 'completed' })
    }));
    await app.close();
  });
});
```

- [ ] **Step 2: Прогнать red**

Run: `npm run test -- tests/telephony/webhook-ingestion.api.test.ts`

Expected: FAIL because route and ingestion service do not exist.

- [ ] **Step 3: Реализовать mapper и ingestion service**

```ts
export const mapProviderEventStatus = (rawStatus: string): CallDialStatus => {
  switch (rawStatus) {
    case 'queued': return 'queued';
    case 'ringing': return 'ringing';
    case 'connected':
    case 'in-progress': return 'answered';
    case 'completed': return 'completed';
    case 'busy': return 'busy';
    case 'no-answer': return 'no_answer';
    case 'voicemail': return 'voicemail';
    case 'transferred': return 'transferred_to_handoff';
    default: return 'unknown';
  }
};

export const ingestProviderCallEvent = async (deps: IngestDeps, input: InboundProviderCallEvent) => {
  await deps.webhookInboxEvent.create({
    data: {
      tenantId: input.tenantId,
      sourceSystem: input.sourceSystem,
      eventId: input.eventId
    }
  });

  const dialStatus = mapProviderEventStatus(input.rawStatus);
  const attempt = await deps.callAttempt.findFirst({
    where: { tenantId: input.tenantId, providerCallId: input.providerCallId }
  });

  if (!attempt) {
    await deps.callReconciliationIssue?.create?.({
      data: {
        tenantId: input.tenantId,
        providerCallId: input.providerCallId,
        issueType: 'missing_attempt',
        severity: 'warning',
        detectedAt: new Date()
      }
    });
    return { accepted: true, linked: false };
  }

  await deps.callEvent.create({
    data: {
      tenantId: input.tenantId,
      callAttemptId: attempt.id,
      eventType: 'provider_status_updated',
      eventSource: `provider_webhook:${input.sourceSystem}`,
      normalizedStatus: dialStatus,
      rawStatus: input.rawStatus,
      occurredAt: input.occurredAt,
      metadata: input.payload
    }
  });

  await deps.callAttempt.update({
    where: { id: attempt.id },
    data: {
      dialStatus,
      providerStatusRaw: input.rawStatus,
      providerStatusUpdatedAt: input.occurredAt,
      lastEventAt: input.occurredAt
    }
  });
};
```

- [ ] **Step 4: Добавить route и регистрацию в `createApp()`**

```ts
app.post('/tenants/:tenantId/telephony/webhooks/:sourceSystem', async (request, reply) => {
  const body = webhookSchema.parse(request.body ?? {});
  await ingestProviderCallEvent(deps, {
    tenantId: params.tenantId,
    sourceSystem: params.sourceSystem,
    eventId: body.eventId,
    providerCallId: body.providerCallId,
    rawStatus: body.status,
    occurredAt: new Date(body.occurredAt),
    payload: body
  });
  return reply.code(202).send({ accepted: true });
});
```

- [ ] **Step 5: Перевести evidence guard на status-поля**

```ts
export const hasCallEvidence = (input: {
  recordingStatus?: 'none' | 'pending' | 'ready' | 'failed' | 'missing' | null;
  transcriptStatus?: 'none' | 'pending' | 'processing' | 'ready' | 'failed' | null;
}): boolean => input.recordingStatus === 'ready' && input.transcriptStatus === 'ready';
```

- [ ] **Step 6: Прогнать green**

Run: `npm run test -- tests/telephony/webhook-ingestion.api.test.ts`

Expected: PASS.

---

### Task 4: Расширить calls API и persistence для enriched list/detail responses

**Files:**
- Modify: `src/routes/calls.ts`
- Modify: `src/routes/qa.ts`
- Modify: `src/telephony/cdr-reconciliation.ts`
- Test: `tests/calls/call-details.api.test.ts`
- Test: `tests/telephony/cdr-reconciliation.test.ts`

**Interfaces:**
- Consumes:
  - `CallEvent`, `CallTranscript`, `CallRecordingAsset`, `CallReconciliationIssue`
  - `deriveConversationStatus()` from Task 1
- Produces:
  - `GET /tenants/:tenantId/campaigns/:campaignId/calls` enriched rows:
    `{ callAttemptId, status, dialStatus, conversationStatus, outcome, complianceStatus, recordingStatus, transcriptStatus, reviewRequired, startedAt, endedAt }`
  - `GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId` enriched card:
    `{ attempt, result, providerStatus, callEvents, transcript, recording, reconciliationIssues, evidenceBundle }`
  - `reconcileCdr()` returns persistent issue contract including `providerCallId`, `kind`, `providerStatus`, `attemptStatus`

- [ ] **Step 1: Написать падающий test на enriched call detail**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('GET call attempt detail', () => {
  it('returns separated technical, evidence and business layers', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: 'campaign-1', tenantId: 'tenant-1' })) },
        callAttempt: {
          findUnique: vi.fn(async () => ({
            id: 'attempt-1',
            tenantId: 'tenant-1',
            campaignId: 'campaign-1',
            debtorRecordId: 'debtor-1',
            telephonyConnectionId: 'conn-1',
            status: 'completed',
            dialStatus: 'completed',
            providerCallId: 'provider-1',
            startedAt: new Date(),
            endedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            debtorRecord: { id: 'debtor-1', tenantId: 'tenant-1', campaignId: 'campaign-1', externalId: 'ext-1' },
            callResult: { id: 'result-1', outcome: 'ptp_created', qaStatus: 'not_reviewed', conversationStatus: 'awaiting_transcription', transcriptStatus: 'processing', recordingStatus: 'ready' }
          }))
        },
        complianceDecision: { findMany: vi.fn(async () => []) },
        usageEvent: { findMany: vi.fn(async () => []) },
        callEvent: { findMany: vi.fn(async () => [{ normalizedStatus: 'completed', rawStatus: 'completed' }]) },
        callTranscript: { findFirst: vi.fn(async () => ({ id: 'tr-1', status: 'processing' })) },
        callRecordingAsset: { findFirst: vi.fn(async () => ({ id: 'rec-1', status: 'ready' })) },
        callReconciliationIssue: { findMany: vi.fn(async () => []) }
      } as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/tenant-1/campaigns/campaign-1/calls/attempt-1',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().attempt.dialStatus).toBe('completed');
    expect(response.json().result.conversationStatus).toBe('awaiting_transcription');
    expect(response.json().providerStatus.normalized).toBe('completed');
    await app.close();
  });
});
```

- [ ] **Step 2: Прогнать red**

Run: `npm run test -- tests/calls/call-details.api.test.ts tests/telephony/cdr-reconciliation.test.ts`

Expected: FAIL because `calls.ts` response shape and reconciliation DTO are still old.

- [ ] **Step 3: Расширить dependencies и DTO в `src/routes/calls.ts`**

```ts
callEvent?: { findMany?: (args: any) => Promise<unknown>; create?: (args: any) => Promise<unknown>; };
callTranscript?: { findFirst?: (args: any) => Promise<unknown>; };
callRecordingAsset?: { findFirst?: (args: any) => Promise<unknown>; };
callReconciliationIssue?: { findMany?: (args: any) => Promise<unknown>; create?: (args: any) => Promise<unknown>; };
```

И в detail handler вернуть:

```ts
return reply.code(200).send({
  attempt: {
    id: attempt.id,
    status: attempt.status,
    dialStatus: attempt.dialStatus ?? summarizeDialStatusFromLegacy(attempt.status),
    providerCallId: attempt.providerCallId
  },
  result: {
    id: attempt.callResult?.id ?? null,
    outcome: attempt.callResult?.outcome ?? null,
    qaStatus: attempt.callResult?.qaStatus ?? null,
    conversationStatus,
    transcriptStatus,
    recordingStatus
  },
  providerStatus: {
    normalized: latestEvent?.normalizedStatus ?? attempt.dialStatus ?? null,
    raw: latestEvent?.rawStatus ?? attempt.providerStatusRaw ?? null,
    source: latestEvent?.eventSource ?? 'legacy',
    receivedAt: latestEvent?.receivedAt ?? null
  },
  callEvents,
  transcript,
  recording,
  reconciliationIssues,
  evidenceBundle: {
    complianceDecisions,
    usageEvents,
    callEvents,
    transcript,
    recording,
    reconciliationIssues
  }
});
```

- [ ] **Step 4: Обновить list endpoint и QA route**

```ts
// list row
{
  callAttemptId: attempt.id,
  status: attempt.status,
  dialStatus: attempt.dialStatus ?? null,
  conversationStatus: attempt.callResult?.conversationStatus ?? null,
  recordingStatus: attempt.callResult?.recordingStatus ?? null,
  transcriptStatus: attempt.callResult?.transcriptStatus ?? null,
  outcome: attempt.callResult?.outcome ?? null,
  reviewRequired: attempt.reviewRequired === true
}
```

QA route не должна терять enriched `CallResult`: оставить update только по `qaStatus`, не затирая новые поля.

- [ ] **Step 5: Расширить reconciliation contract**

```ts
export type CdrMismatch = {
  providerCallId: string;
  providerStatus: string | null;
  attemptStatus: string | null;
  kind: 'missing_attempt' | 'missing_cdr' | 'status_mismatch';
  severity: 'warning' | 'critical';
};
```

`severity = kind === 'status_mismatch' ? 'warning' : 'critical'` для первой версии.

- [ ] **Step 6: Прогнать green**

Run: `npm run test -- tests/calls/call-details.api.test.ts tests/telephony/cdr-reconciliation.test.ts tests/calls/live-call.api.test.ts`

Expected: PASS.

---

### Task 5: Показать раздельные слои статусов в UI журнала звонков и карточке разговора

**Files:**
- Modify: `prototype.html`
- Modify: `tests/prototype-calls-journal.test.ts`
- Modify: `tests/prototype-call-card.test.ts`
- Modify: `PRODUCT_LANGUAGE.md`

**Interfaces:**
- Consumes:
  - call row/detail DTO from Task 4
  - product copy constraints from `PRODUCT_LANGUAGE.md`
- Produces:
  - calls table columns: `Статус попытки`, `Результат разговора`, `Решение`, `Запись / расшифровка`
  - call card sections: `Ход звонка`, `Исход попытки и результат разговора`, `Расшифровка`, `Техническая диагностика`
  - helper formatters:
    - `formatDialStatusLabel(status: string): string`
    - `formatEvidenceStatusLabel(input: { recordingStatus?: string; transcriptStatus?: string; reviewRequired?: boolean; }): string`

- [ ] **Step 1: Переписать UI tests под layered statuses**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../prototype.html', import.meta.url), 'utf8');
const calls = html.match(/data-camp-view="calls"[\s\S]*?<\/section>/)?.[0] ?? html;

describe('prototype calls journal', () => {
  it('keeps attempt status separate from conversation result and evidence state', () => {
    expect(calls).toContain('Статус попытки');
    expect(calls).toContain('Результат разговора');
    expect(calls).toContain('Решение');
    expect(calls).toContain('Запись / расшифровка');
  });
});
```

И для карточки:

```ts
it('shows recording and transcript state separately from outcome', () => {
  expect(html).toContain('id="callCardRecordingStatus"');
  expect(html).toContain('id="callCardTranscriptEmpty"');
  expect(html).toContain('Техническая диагностика');
});
```

- [ ] **Step 2: Прогнать red**

Run: `npm run test -- tests/prototype-calls-journal.test.ts tests/prototype-call-card.test.ts`

Expected: FAIL на старом `prototype.html`.

- [ ] **Step 3: Обновить markup таблицы и карточки звонка**

```html
<table class="wide">
  <thead>
    <tr>
      <th>Время</th>
      <th>Должник</th>
      <th>Статус попытки</th>
      <th>Результат разговора</th>
      <th>Решение</th>
      <th>Запись / расшифровка</th>
    </tr>
  </thead>
  <tbody id="callsTableBody"></tbody>
</table>
```

И в drawer добавить секцию:

```html
<div class="call-detail-block">
  <div class="panel-title" style="margin-bottom:8px">Техническая диагностика</div>
  <div id="callCardDiagnostics"></div>
</div>
```

- [ ] **Step 4: Обновить formatters и render logic**

```js
function formatDialStatusLabel(status){
  const labels = {
    created: 'Подготовка',
    queued: 'В очереди',
    dialing: 'Набор',
    ringing: 'Идет вызов',
    answered: 'Соединение установлено',
    in_conversation: 'Идет разговор',
    transferred_to_handoff: 'Переведен оператору',
    completed: 'Завершен',
    no_answer: 'Нет ответа',
    busy: 'Занято',
    voicemail: 'Голосовая почта',
    failed: 'Ошибка звонка',
    blocked: 'Звонок заблокирован',
    unknown: 'Статус уточняется'
  };
  return labels[status] || 'Статус уточняется';
}

function formatEvidenceStatusLabel(item){
  if (item.reviewRequired) return 'Требует проверки';
  if (item.recordingStatus === 'missing') return 'Записи нет';
  if (item.transcriptStatus === 'processing') return 'Расшифровка в обработке';
  if (item.transcriptStatus === 'failed') return 'Расшифровку получить не удалось';
  if (item.recordingStatus === 'ready' && item.transcriptStatus === 'ready') return 'Запись хранится · Расшифровка готова';
  return 'Статус уточняется';
}
```

- [ ] **Step 5: Обновить product copy**

Добавить в `PRODUCT_LANGUAGE.md`:

```md
| Call dial status | статус попытки | dial status | В журнале звонков |
| Conversation status | состояние разговора | conversation status | Не показывать пользователю как backend-термин |
| Recording/transcript state | запись / расшифровка | evidence | Отдельно от исхода разговора |
```

- [ ] **Step 6: Прогнать green**

Run: `npm run test -- tests/prototype-calls-journal.test.ts tests/prototype-call-card.test.ts`

Expected: PASS.

---

### Task 6: Сквозная проверка feature slice и handoff для дальнейшего исполнения

**Files:**
- Modify: `docs/superpowers/specs/2026-08-19-sip-telephony-integration-design.md` (только если по ходу появились уточнения интерфейсов)
- Modify: `docs/superpowers/plans/2026-08-19-sip-telephony-pilot-implementation.md` (отметки self-review, если найдены gaps)
- Test: `tests/calls/live-call.api.test.ts`
- Test: `tests/telephony/mango-adapter.test.ts`
- Test: `tests/prototype-*.test.ts`

**Interfaces:**
- Consumes: результаты Tasks 1–5
- Produces:
  - подтвержденный execution order
  - финальный regression command set

- [ ] **Step 1: Прогнать backend regression pack**

Run:

```bash
npm run test -- tests/domain-call-lifecycle.test.ts tests/domain-telephony-connection.test.ts tests/telephony/webhook-ingestion.api.test.ts tests/telephony/cdr-reconciliation.test.ts tests/calls/call-details.api.test.ts tests/calls/live-call.api.test.ts
```

Expected: PASS.

- [ ] **Step 2: Прогнать UI regression pack**

Run:

```bash
npm run test -- tests/prototype-calls-journal.test.ts tests/prototype-call-card.test.ts
```

Expected: PASS.

- [ ] **Step 3: Проверить Prisma schema и compile-level safety**

Run:

```bash
npx prisma validate
npm run test -- tests/telephony/mango-adapter.test.ts
```

Expected: PASS.

- [ ] **Step 4: Проверить spec coverage перед реализацией**

Сверить:

```md
- state model (§7) -> Task 1
- DB/evidence storage (§9) -> Task 2
- webhook/CDR ingestion (§5, §10, §11.1) -> Task 3
- enriched status API (§8, §11.1) -> Task 4
- call journal/card UI (§8.2, §8.3, §11.3) -> Task 5
```

Если появляется требование без задачи, сначала обновить этот план, потом исполнять код.

---

## Self-Review

- **Spec coverage:** статусная модель, event/evidence слой, TelephonyConnection capacity/capabilities, webhook ingestion, reconciliation, enriched API, UI журнала звонков и карточки разговора покрыты Tasks 1–5.
- **Coverage gap (§11.1):** Tasks 1–5 покрывают webhook ingestion, CDR reconciliation и существующий provider capability probe contract, но не добавляют endpoint/worker для polling статусов и HTTP health/probe API. Эти интерфейсы остаются отдельным follow-up до заявления о полном покрытии §11.1.
- **No-gap scan:** в задачах нет незаполненных служебных маркеров или отложенных шагов; SQL и DTO в задачах раскрыты до конкретных колонок и полей ответа.
- **Type consistency:** `CallDialStatus`, `TranscriptStatus`, `RecordingStatus`, `ConversationStatus` вводятся в Task 1 и затем переиспользуются в Prisma/API/UI без переименований.
- **Execution order:** сначала pure domain state model, затем schema/migration, затем ingestion, затем API, затем UI, затем сквозная регрессия. Этот порядок минимизирует конфликтующие правки и сохраняет фичу проверяемой на каждом шаге.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-19-sip-telephony-pilot-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
