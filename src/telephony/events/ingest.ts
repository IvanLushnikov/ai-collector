import type { CallDialStatus } from '../../domain/call-lifecycle/index.js';
import { mapProviderEventStatus } from './map-provider-event.js';

export type InboundProviderCallEvent = {
  tenantId: string;
  sourceSystem: string;
  eventId: string;
  providerCallId: string;
  rawStatus: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
};

type StoreMethod = (args: any) => Promise<any>;

export type IngestDeps = {
  $transaction?: <T>(apply: (transaction: IngestDeps) => Promise<T>) => Promise<T>;
  webhookInboxEvent: {
    findUnique: StoreMethod;
    create: StoreMethod;
  };
  callAttempt: {
    findFirst: StoreMethod;
    updateMany: StoreMethod;
  };
  callEvent: {
    create: StoreMethod;
  };
  callReconciliationIssue?: {
    create?: StoreMethod;
  };
};

export type IngestProviderCallEventResult =
  | {
    duplicate: false;
    linked: true;
    stale: true;
    callAttemptId: string;
    dialStatus: CallDialStatus;
    terminal: boolean;
  }
  | {
    duplicate: false;
    linked: true;
    callAttemptId: string;
    dialStatus: CallDialStatus;
    terminal: boolean;
  }
  | {
    duplicate: false;
    linked: false;
  }
  | {
    duplicate: true;
  };

const terminalDialStatuses = new Set<CallDialStatus>([
  'completed',
  'no_answer',
  'busy',
  'voicemail',
  'failed',
  'cancelled',
  'blocked',
  'transferred_to_handoff'
]);

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && error.code === 'P2002';

const applyProviderCallEvent = async (
  deps: IngestDeps,
  input: InboundProviderCallEvent
): Promise<IngestProviderCallEventResult> => {
  const inboxKey = {
    tenantId: input.tenantId,
    sourceSystem: input.sourceSystem,
    eventId: input.eventId
  };
  const existing = await deps.webhookInboxEvent.findUnique({
    where: {
      tenantId_sourceSystem_eventId: inboxKey
    }
  });
  if (existing) {
    return { duplicate: true };
  }

  try {
    await deps.webhookInboxEvent.create({
      data: inboxKey
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { duplicate: true };
    }
    throw error;
  }

  const dialStatus = mapProviderEventStatus(input.rawStatus);
  const terminal = terminalDialStatuses.has(dialStatus);
  const attempt = await deps.callAttempt.findFirst({
    where: {
      tenantId: input.tenantId,
      providerCallId: input.providerCallId
    }
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
    return {
      duplicate: false,
      linked: false
    };
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
      isTerminal: terminal,
      metadata: input.payload
    }
  });

  const updateResult = await deps.callAttempt.updateMany({
    where: {
      id: attempt.id,
      tenantId: input.tenantId,
      OR: [
        { providerStatusUpdatedAt: null },
        {
          providerStatusUpdatedAt: {
            lt: input.occurredAt
          }
        }
      ]
    },
    data: {
      dialStatus,
      providerStatusRaw: input.rawStatus,
      providerStatusUpdatedAt: input.occurredAt,
      lastEventAt: input.occurredAt
    }
  });

  if (updateResult.count === 0) {
    const currentAttempt = await deps.callAttempt.findFirst({
      where: {
        tenantId: input.tenantId,
        providerCallId: input.providerCallId
      }
    });
    const currentDialStatus = (currentAttempt?.dialStatus ?? attempt.dialStatus ?? dialStatus) as CallDialStatus;
    return {
      duplicate: false,
      linked: true,
      stale: true,
      callAttemptId: attempt.id,
      dialStatus: currentDialStatus,
      terminal: terminalDialStatuses.has(currentDialStatus)
    };
  }

  return {
    duplicate: false,
    linked: true,
    callAttemptId: attempt.id,
    dialStatus,
    terminal
  };
};

export const ingestProviderCallEvent = async (
  deps: IngestDeps,
  input: InboundProviderCallEvent
): Promise<IngestProviderCallEventResult> => {
  if (deps.$transaction) {
    return deps.$transaction((transaction) =>
      applyProviderCallEvent(transaction, input));
  }
  return applyProviderCallEvent(deps, input);
};
