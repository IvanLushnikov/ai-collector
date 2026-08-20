import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ComplianceEngine } from '../compliance/engine/compliance-engine.js';
import { CallWindowComplianceRule } from '../compliance/rules/call-window.js';
import { ConsentStatusRule } from '../compliance/rules/consent-status.js';
import { DebtStatusRule } from '../compliance/rules/debt-status.js';
import { FrequencyLimitRule } from '../compliance/rules/frequency-limit.js';
import { SuppressionRule, createInMemorySuppressionLookup, type SuppressionLookup } from '../compliance/rules/suppression.js';
import {
  createInMemoryFrequencyLedgerRepository,
  recordFrequencyAttempt,
  shouldRecordFrequencyAttempt,
  type FrequencyLedgerRepository
} from '../domain/frequency-ledger/index.js';
import { CallAttemptStatus } from '../domain/call-attempt/index.js';
import { CallResultOutcome, isCallResultQaStatus } from '../domain/call-result/index.js';
import {
  deriveConversationStatus,
  type CallDialStatus,
  type RecordingStatus,
  type TranscriptStatus
} from '../domain/call-lifecycle/index.js';
import { UsageEventType } from '../domain/usage-event/index.js';
import {
  VoiceCallStatus,
  VoiceProviderAdapter,
  isTerminalCallStatus
} from '../telephony/voice-provider/adapter.js';
import { SandboxVoiceProvider } from '../telephony/sandbox-provider/index.js';
import { resolveActorId } from '../server/authz/actor.js';
import { authorizeZone } from '../server/authz/index.js';
import { evaluateCampaignReadiness } from '../campaigns/readiness.js';
import { maskSensitiveFields } from '../logging/mask.js';
import {
  createVoiceProviderResolver,
  UnknownVoiceProviderError,
  type VoiceProviderResolver
} from '../telephony/voice-provider/resolver.js';
import { shouldEnqueueSandboxCall } from '../jobs/sandbox-enqueue.js';
import { canRunSandboxStartJob, runSandboxOrchestratorStub } from '../jobs/worker.js';
import { createSandboxStartJob } from '../jobs/queue.js';
import { isLiveCallsEnabled } from '../config/env.js';
import { assertSpeechCredentialsReady } from '../speech/credentials/assert-ready.js';
import { shouldAutoPauseForMissingEvidence } from '../calls/evidence-guard.js';
import { isPilotCapReached } from '../domain/campaign/pilot-cap.js';
import {
  CAMPAIGN_PAUSE_REASON_TEXT,
  enrichBlockedReason,
  toComplianceDecisionSummary
} from '../domain/compliance-block-kind/index.js';

type CallDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  user: {
    findFirst: (args: any) => Promise<unknown>;
  };
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  debtorRecord: {
    findUnique: (args: any) => Promise<unknown>;
    count?: (args: any) => Promise<number>;
  };
  scriptVersion?: {
    findMany?: (args: any) => Promise<unknown>;
    findFirst?: (args: any) => Promise<unknown>;
  };
  telephonyConnection?: {
    findUnique?: (args: any) => Promise<unknown>;
  };
  callAttempt: {
    create: (args: any) => Promise<unknown>;
    findUnique: (args: any) => Promise<unknown>;
    findMany: (args: any) => Promise<unknown>;
  };
  callResult: {
    create: (args: any) => Promise<unknown>;
  };
  usageEvent?: {
    create: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
  };
  complianceDecision?: {
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
    count?: (args: any) => Promise<number>;
  };
  callEvent?: {
    findMany?: (args: any) => Promise<unknown>;
    create?: (args: any) => Promise<unknown>;
  };
  callTranscript?: {
    findFirst?: (args: any) => Promise<unknown>;
  };
  callRecordingAsset?: {
    findFirst?: (args: any) => Promise<unknown>;
  };
  callReconciliationIssue?: {
    findMany?: (args: any) => Promise<unknown>;
    create?: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
  complianceEngine?: ComplianceEngine;
  voiceProvider?: VoiceProviderAdapter;
  voiceProviderResolver?: VoiceProviderResolver;
  frequencyLedger?: FrequencyLedgerRepository;
  suppressionLookup?: SuppressionLookup;
  sandboxCallsQueueEnabled?: boolean;
  liveCallsEnabled?: boolean;
};

const tenantCampaignDebtorCallSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid(),
  debtorRecordId: z.string().uuid()
});

const callStartSchema = z.object({
  telephonyConnectionId: z.string().min(1).optional()
});

const tenantCampaignCallSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid(),
  callAttemptId: z.string().uuid()
});

const createEngine = (
  deps: Pick<CallDependencies, 'complianceDecision' | 'complianceEngine' | 'frequencyLedger' | 'suppressionLookup'>
): ComplianceEngine => {
  if (deps.complianceEngine) {
    return deps.complianceEngine;
  }

  return new ComplianceEngine(
    [
      new CallWindowComplianceRule(),
      new ConsentStatusRule(),
      new DebtStatusRule(),
      new FrequencyLimitRule(deps.frequencyLedger ?? createInMemoryFrequencyLedgerRepository()),
      new SuppressionRule(deps.suppressionLookup ?? createInMemorySuppressionLookup())
    ],
    {
      ruleVersion: 'v1',
      complianceDecisionStore: deps.complianceDecision?.create
        ? {
            create: (args: {
              data: {
                tenantId: string;
                campaignId: string;
                debtorRecordId: string;
                decision: string;
                reasonCode: string;
                reasonText: string;
                ruleVersion: string;
                checkedAt: Date;
              };
            }) => deps.complianceDecision!.create!(args)
          }
        : undefined
    }
  );
};

const defaultVoiceProvider = new SandboxVoiceProvider();

const callDialStatuses = new Set<CallDialStatus>([
  'created',
  'queued',
  'dialing',
  'ringing',
  'answered',
  'in_conversation',
  'handoff_requested',
  'transferred_to_handoff',
  'completed',
  'no_answer',
  'busy',
  'voicemail',
  'failed',
  'cancelled',
  'blocked',
  'unknown'
]);
const recordingStatuses = new Set<RecordingStatus>(['none', 'pending', 'ready', 'failed', 'missing']);
const transcriptStatuses = new Set<TranscriptStatus>(['none', 'pending', 'processing', 'ready', 'failed']);
const connectedDialStatuses = new Set<CallDialStatus>([
  'answered',
  'in_conversation',
  'completed',
  'handoff_requested',
  'transferred_to_handoff'
]);

const normalizeLifecycleEvidence = (input: {
  dialStatus?: string | null;
  recordingStatus?: string | null;
  transcriptStatus?: string | null;
  reviewRequired: boolean;
}): {
  recordingStatus: string | null;
  transcriptStatus: string | null;
  reviewRequired: boolean;
  forceDerivation: boolean;
} => {
  const connected = Boolean(
    input.dialStatus
    && connectedDialStatuses.has(input.dialStatus as CallDialStatus)
  );
  const recordingStatus = input.recordingStatus ?? (connected ? 'missing' : null);
  const transcriptStatus = input.transcriptStatus
    ?? (connected ? (recordingStatus === 'ready' ? 'pending' : 'failed') : null);

  return {
    recordingStatus,
    transcriptStatus,
    reviewRequired: input.reviewRequired || (connected && recordingStatus === 'missing'),
    forceDerivation: connected && (!input.recordingStatus || !input.transcriptStatus)
  };
};

const deriveConversationStatusIfPossible = (input: {
  storedStatus?: string | null;
  dialStatus?: string | null;
  recordingStatus?: string | null;
  transcriptStatus?: string | null;
  reviewRequired: boolean;
  forceDerivation?: boolean;
}): string | null => {
  if (
    input.dialStatus
    && input.recordingStatus
    && input.transcriptStatus
    && callDialStatuses.has(input.dialStatus as CallDialStatus)
    && recordingStatuses.has(input.recordingStatus as RecordingStatus)
    && transcriptStatuses.has(input.transcriptStatus as TranscriptStatus)
    && (input.forceDerivation || input.reviewRequired || !input.storedStatus)
  ) {
    return deriveConversationStatus({
      dialStatus: input.dialStatus as CallDialStatus,
      recordingStatus: input.recordingStatus as RecordingStatus,
      transcriptStatus: input.transcriptStatus as TranscriptStatus,
      reviewRequired: input.reviewRequired
    });
  }
  return input.storedStatus ?? null;
};

const mapVoiceStatusToCallAttemptStatus = (status: VoiceCallStatus): CallAttemptStatus => {
  switch (status) {
    case 'queued':
      return 'queued';
    case 'ringing':
      return 'ringing';
    case 'answered':
      return 'answered';
    case 'completed':
      return 'completed';
    case 'voicemail':
    case 'no_answer':
      return 'no_answer';
    case 'busy':
    case 'failed':
    case 'transferred_to_handoff':
      return 'failed';
    case 'unknown':
      return 'failed';
    default:
      return 'initiated';
  }
};

const mapVoiceStatusToCallResultOutcome = (status: VoiceCallStatus): CallResultOutcome => {
  switch (status) {
    case 'completed':
      return 'ptp_created';
    case 'voicemail':
      return 'callback_requested';
    case 'no_answer':
      return 'no_answer';
    case 'busy':
      return 'wrong_number';
    case 'transferred_to_handoff':
      return 'handoff';
    case 'failed':
      return 'error';
    default:
      return 'not_called';
  }
};

const createUsageEvent = async (
  usageEventStore: CallDependencies['usageEvent'] | undefined,
  data: {
    tenantId: string;
    campaignId: string;
    eventType: UsageEventType;
    sourceId: string;
  }
) => {
  if (!usageEventStore?.create) {
    return;
  }

  await usageEventStore.create({
    data: {
      tenantId: data.tenantId,
      campaignId: data.campaignId,
      eventType: data.eventType,
      quantity: 1,
      unit: 'call',
      sourceId: data.sourceId,
      occurredAt: new Date(),
      credentialMode: 'fake'
    }
  });
};

export const guardLiveSpeechCredentialsIfEnabled = async (
  input: Parameters<typeof assertSpeechCredentialsReady>[0]
): Promise<void> => {
  if (!isLiveCallsEnabled()) {
    return;
  }
  await assertSpeechCredentialsReady(input);
};

export const evaluateLiveCallGuards = (input: {
  answered: boolean;
  recordingStatus?: RecordingStatus | null;
  transcriptStatus?: TranscriptStatus | null;
  dailyCallCap?: number | null;
  startedToday: number;
}): { missingEvidence: boolean; pilotCapReached: boolean } => {
  if (!isLiveCallsEnabled()) {
    return { missingEvidence: false, pilotCapReached: false };
  }
  return {
    missingEvidence: shouldAutoPauseForMissingEvidence({
      channel: 'live',
      answered: input.answered,
      recordingStatus: input.recordingStatus,
      transcriptStatus: input.transcriptStatus
    }),
    pilotCapReached: isPilotCapReached({
      channel: 'live',
      dailyCallCap: input.dailyCallCap,
      startedToday: input.startedToday
    })
  };
};

const createAuditEvent = async (
  deps: CallDependencies,
  actor: { id: string },
  actorTenantId: string,
  data: {
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
  }
) => {
  if (!deps.auditLog?.create) {
    return;
  }

  await deps.auditLog.create({
    data: {
      tenantId: actorTenantId,
      userId: actor.id,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: maskSensitiveFields(data.metadata)
    }
  });
};

export const registerCallRoutes = (app: FastifyInstance, deps: CallDependencies): void => {
  const tenantCampaignCallsSchema = z.object({
    tenantId: z.string().uuid(),
    campaignId: z.string().uuid()
  });

  const tenantCampaignCallsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).max(1000).default(0),
    outcome: z
      .enum([
        'not_called',
        'no_answer',
        'callback_requested',
        'wrong_number',
        'ptp_created',
        'handoff',
        'dispute',
        'blocked',
        'error'
      ])
      .optional(),
    qaStatus: z.enum(['not_reviewed', 'approved', 'flagged']).optional()
  });

  app.post(
    '/tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox',
    { preValidation: authorizeZone('calls', 'write') },
    async (request, reply) => {
    const params = tenantCampaignDebtorCallSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const body = callStartSchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: body.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as {
      id: string;
      tenantId: string;
      status?: string;
      updatedAt?: string;
      telephonyConnectionId?: string | null;
    } | null;

    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const readiness = await evaluateCampaignReadiness(
      deps,
      {
        id: campaign.id,
        tenantId: campaign.tenantId,
        status: campaign.status ?? 'draft',
        updatedAt: campaign.updatedAt ?? new Date(0).toISOString(),
        telephonyConnectionId: campaign.telephonyConnectionId
      },
      params.data.tenantId,
      { channel: 'sandbox' }
    );

    if (readiness.blocked || readiness.stale) {
      return reply.code(409).send({
        error: 'CAMPAIGN_NOT_READY',
        ...readiness
      });
    }

    const debtorRecord = await deps.debtorRecord.findUnique({
      where: { id: params.data.debtorRecordId }
    }) as {
      id: string;
      tenantId: string;
      campaignId: string;
      phone: string;
      timezone: string;
      debtAmount: number | string;
      debtStatus: string;
      consentStatus: string;
      externalId?: string;
    } | null;

    if (!debtorRecord || debtorRecord.campaignId !== params.data.campaignId || debtorRecord.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'DEBTOR_RECORD_NOT_FOUND' });
    }

    const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
    if (!actorId) {
      return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
    }

    const debtAmount = Number(debtorRecord.debtAmount);
    if (!Number.isFinite(debtAmount)) {
      return reply.code(400).send({
        error: 'INVALID_DEBT_AMOUNT'
      });
    }

    const engine = createEngine(deps);
    const decision = await engine.evaluate({
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      debtorRecordId: params.data.debtorRecordId,
      phone: debtorRecord.phone,
      timezone: debtorRecord.timezone,
      debtAmount,
      debtStatus: debtorRecord.debtStatus,
      consentStatus: debtorRecord.consentStatus,
      creditorKey: params.data.tenantId,
      obligationId: debtorRecord.externalId ?? debtorRecord.id
    });

    if (decision.decision === 'block') {
      await createAuditEvent(deps, { id: actorId }, params.data.tenantId, {
        action: 'call.sandbox_blocked',
        entityType: 'debtorRecord',
        entityId: debtorRecord.id,
        metadata: {
          debtorRecordId: params.data.debtorRecordId,
          campaignId: params.data.campaignId,
          callOutcome: 'blocked',
          reasons: decision.blockedReasons,
          rules: decision.rules
        }
      });

      return reply.code(403).send({
        decision: decision.decision,
        reasons: decision.blockedReasons.map(enrichBlockedReason),
        rules: decision.rules,
        allowed: false,
        error: 'COMPLIANCE_BLOCK'
      });
    }

    const activeScript = await deps.scriptVersion?.findFirst?.({
      where: {
        campaignId: params.data.campaignId,
        status: 'active'
      },
      orderBy: {
        version: 'desc'
      },
      select: {
        id: true
      }
    }) as { id: string } | null | undefined;

    if (!activeScript) {
      return reply.code(409).send({ error: 'SCRIPT_VERSION_MISSING' });
    }

    if (shouldEnqueueSandboxCall(deps.sandboxCallsQueueEnabled)) {
      if (!canRunSandboxStartJob(campaign.status ?? 'draft')) {
        return reply.code(409).send({
          error: 'CAMPAIGN_JOB_BLOCKED',
          blockKind: 'campaign_pause',
          reasonText: CAMPAIGN_PAUSE_REASON_TEXT
        });
      }

      return reply.code(202).send({
        queued: true,
        job: createSandboxStartJob({
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          debtorRecordId: params.data.debtorRecordId,
          campaignStatus: campaign.status ?? 'draft'
        })
      });
    }

    const telephonyConnection = campaign.telephonyConnectionId
      ? await deps.telephonyConnection?.findUnique?.({
          where: { id: campaign.telephonyConnectionId }
        }) as { provider?: string; mode?: string } | null
      : null;

    if (telephonyConnection?.mode === 'production') {
      return reply.code(409).send({ error: 'SANDBOX_CONNECTION_REQUIRED' });
    }

    const resolver = deps.voiceProviderResolver ?? createVoiceProviderResolver({
      sandbox: deps.voiceProvider ?? defaultVoiceProvider
    });

    let provider: VoiceProviderAdapter;
    try {
      provider = resolver.resolve(telephonyConnection?.provider ?? 'sandbox');
    } catch (error) {
      if (error instanceof UnknownVoiceProviderError) {
        return reply.code(422).send({
          error: 'UNKNOWN_VOICE_PROVIDER',
          provider: error.provider
        });
      }
      throw error;
    }

    const providerCall = await provider.startCall({
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      debtorRecordId: params.data.debtorRecordId,
      phone: debtorRecord.phone
    });

    await createUsageEvent(deps.usageEvent, {
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      eventType: 'call_started',
      sourceId: `sandbox-call:${providerCall.providerCallId}:started`
    });

    const created = await deps.callAttempt.create({
      data: {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId,
        debtorRecordId: params.data.debtorRecordId,
        telephonyConnectionId: campaign.telephonyConnectionId ?? body.data.telephonyConnectionId ?? `${params.data.tenantId}-sandbox`,
        scriptVersionId: activeScript.id,
        status: mapVoiceStatusToCallAttemptStatus(providerCall.status),
        providerCallId: providerCall.providerCallId,
        identityVerified: false,
        identityVerifiedAt: null,
        startedAt: new Date(),
        endedAt: isTerminalCallStatus(providerCall.status) ? new Date() : undefined
      }
    });

    const callAttemptId = (created as { id: string }).id;
    const telephonyMode = telephonyConnection?.mode ?? 'sandbox';

    if (
      deps.frequencyLedger
      && shouldRecordFrequencyAttempt({
        channel: 'sandbox',
        telephonyMode: telephonyMode ?? 'sandbox'
      })
    ) {
      await recordFrequencyAttempt(deps.frequencyLedger, {
        callAttemptId,
        tenantId: params.data.tenantId,
        creditorKey: params.data.tenantId,
        obligationId: debtorRecord.externalId ?? debtorRecord.id,
        status: mapVoiceStatusToCallAttemptStatus(providerCall.status),
        occurredAt: new Date()
      });
    }
    const defaultQaStatus = 'not_reviewed';
    if (!isCallResultQaStatus(defaultQaStatus)) {
      return reply.code(500).send({ error: 'INVALID_QA_STATUS' });
    }

    const callResult = await deps.callResult.create({
      data: {
        tenantId: params.data.tenantId,
        callAttemptId,
        outcome: mapVoiceStatusToCallResultOutcome(providerCall.status),
        qaStatus: defaultQaStatus,
        reason: 'sandbox_call_result',
        transcriptUrl: `sandbox://transcripts/${providerCall.providerCallId}.txt`,
        recordingUrl: `sandbox://recordings/${providerCall.providerCallId}.mp3`
      }
    });

    if (isTerminalCallStatus(providerCall.status)) {
      await createUsageEvent(deps.usageEvent, {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId,
        eventType: 'call_completed',
        sourceId: `sandbox-call:${providerCall.providerCallId}:completed`
      });
    }

    const orchestrator = runSandboxOrchestratorStub({ alreadyRecordedUsage: true });

    await createAuditEvent(deps, { id: actorId }, params.data.tenantId, {
      action: 'call.sandbox_started',
      entityType: 'callAttempt',
      entityId: callAttemptId,
      metadata: {
        debtorRecordId: params.data.debtorRecordId,
        campaignId: params.data.campaignId,
        callAttemptId,
        providerCallId: providerCall.providerCallId,
        callStatus: providerCall.status,
        decision: decision.decision,
        orchestratorState: orchestrator.state,
        usageEventsCreated: orchestrator.usageEventsCreated
      }
    });

    return reply.code(201).send({
      allowed: true,
      decision: decision.decision,
      reasons: decision.blockedReasons,
      rules: decision.rules,
      callStatus: providerCall.status,
      callAttempt: created,
      callResult
    });
  });

  app.post(
    '/tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/live',
    { preValidation: authorizeZone('calls', 'write') },
    async (request, reply) => {
      const liveEnabled = deps.liveCallsEnabled ?? isLiveCallsEnabled();
      if (!liveEnabled) {
        return reply.code(403).send({ error: 'LIVE_CALLS_DISABLED' });
      }

      return reply.code(501).send({ error: 'LIVE_CALLS_NOT_IMPLEMENTED' });
    }
  );

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/calls',
    {
      preValidation: authorizeZone('calls', 'read')
    },
    async (request, reply) => {
    const params = tenantCampaignCallsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const query = tenantCampaignCallsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: query.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as { id: string; tenantId: string } | null;
    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const attempts = (await deps.callAttempt.findMany({
      where: {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId,
        ...(query.data.outcome || query.data.qaStatus
          ? {
              callResult: {
                ...(query.data.outcome ? { outcome: query.data.outcome } : {}),
                ...(query.data.qaStatus ? { qaStatus: query.data.qaStatus } : {})
              }
            }
          : {})
      },
      skip: query.data.offset,
      take: query.data.limit,
      orderBy: {
        startedAt: 'asc'
      },
      include: {
        debtorRecord: {
          select: {
            externalId: true
          }
        },
        callResult: {
          select: {
            outcome: true,
            qaStatus: true,
            conversationStatus: true,
            transcriptStatus: true,
            recordingStatus: true
          }
        }
      }
    }) as Array<{
      id: string;
      debtorRecordId?: string;
      status: string;
      dialStatus?: string | null;
      reviewRequired?: boolean;
      startedAt: string | Date;
      endedAt: string | Date | null;
      debtorRecord: { externalId: string } | null;
      callResult: {
        outcome: string;
        qaStatus?: string;
        conversationStatus?: string | null;
        transcriptStatus?: string | null;
        recordingStatus?: string | null;
      } | null;
    }> ) ?? [];

    const debtorRecordIds = Array.from(new Set(
      attempts
        .map((attempt) => attempt.debtorRecordId)
        .filter((debtorRecordId): debtorRecordId is string => Boolean(debtorRecordId))
    ));
    const complianceDecisions = debtorRecordIds.length > 0 && deps.complianceDecision?.findMany
      ? (await deps.complianceDecision.findMany({
          where: {
            tenantId: params.data.tenantId,
            debtorRecordId: {
              in: debtorRecordIds
            }
          },
          orderBy: {
            checkedAt: 'desc'
          },
          select: {
            debtorRecordId: true,
            decision: true,
            reasonCode: true,
            reasonText: true,
            checkedAt: true
          }
        })) as Array<{
          debtorRecordId: string;
          decision: string;
          reasonCode?: string | null;
          reasonText?: string | null;
          checkedAt: string | Date;
        }>
      : [];
    const latestComplianceDecisionByDebtor = new Map<string, {
      decision: string;
      reasonCode: string | null;
      reasonText: string | null;
      checkedAt: string | Date;
    }>();
    for (const decision of complianceDecisions) {
      if (!latestComplianceDecisionByDebtor.has(decision.debtorRecordId)) {
        latestComplianceDecisionByDebtor.set(decision.debtorRecordId, {
          decision: decision.decision,
          reasonCode: decision.reasonCode ?? null,
          reasonText: decision.reasonText ?? null,
          checkedAt: decision.checkedAt
        });
      }
    }

    return reply.code(200).send(
      attempts.map((attempt) => {
        const dialStatus = attempt.dialStatus ?? attempt.status;
        const lifecycleEvidence = normalizeLifecycleEvidence({
          dialStatus,
          recordingStatus: attempt.callResult?.recordingStatus,
          transcriptStatus: attempt.callResult?.transcriptStatus,
          reviewRequired: attempt.reviewRequired === true
        });
        const complianceDecision = attempt.debtorRecordId
          ? latestComplianceDecisionByDebtor.get(attempt.debtorRecordId)
          : undefined;
        return {
          callAttemptId: attempt.id,
          status: attempt.status,
          dialStatus,
          conversationStatus: deriveConversationStatusIfPossible({
            storedStatus: attempt.callResult?.conversationStatus,
            dialStatus,
            ...lifecycleEvidence
          }),
          outcome: attempt.callResult?.outcome ?? null,
          complianceStatus: complianceDecision?.decision === 'allow'
            ? 'allowed'
            : complianceDecision?.decision === 'block'
              ? 'blocked'
              : 'not_checked',
          complianceDecision: complianceDecision
            ? toComplianceDecisionSummary({
                decision: complianceDecision.decision,
                reasonCode: complianceDecision.reasonCode,
                reasonText: complianceDecision.reasonText,
                checkedAt: complianceDecision.checkedAt
              })
            : null,
          recordingStatus: lifecycleEvidence.recordingStatus,
          transcriptStatus: lifecycleEvidence.transcriptStatus,
          reviewRequired: lifecycleEvidence.reviewRequired,
          debtorExternalId: attempt.debtorRecord?.externalId ?? null,
          startedAt: attempt.startedAt,
          endedAt: attempt.endedAt ?? null
        };
      })
    );
  });

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId',
    {
      preValidation: authorizeZone('calls', 'read')
    },
    async (request, reply) => {
    const params = tenantCampaignCallSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as { id: string; tenantId: string } | null;
    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const rawAttempt = await deps.callAttempt.findUnique({
      where: {
        id: params.data.callAttemptId
      },
      include: {
        callResult: true,
        debtorRecord: {
          select: {
            id: true,
            tenantId: true,
            campaignId: true,
            externalId: true
          }
        }
      }
    });

    const attempt = rawAttempt as ({
      id: string;
      tenantId: string;
      campaignId: string;
      debtorRecordId: string;
      telephonyConnectionId: string;
      scriptVersionId?: string | null;
      status: string;
      dialStatus?: string | null;
      providerStatusRaw?: string | null;
      reviewRequired?: boolean;
      providerCallId: string;
      identityVerified?: boolean;
      identityVerifiedAt?: string | Date | null;
      startedAt: string | Date;
      endedAt: string | Date | null;
      createdAt: string | Date;
      updatedAt: string | Date;
      callResult: {
        id: string;
        outcome: string;
        qaStatus: string;
        reason: string | null;
        transcriptUrl: string | null;
        recordingUrl: string | null;
        conversationStatus?: string | null;
        transcriptStatus?: string | null;
        recordingStatus?: string | null;
      } | null;
      debtorRecord: {
        id: string;
        tenantId: string;
        campaignId: string;
        externalId: string;
      };
    } | null);

    if (
      !attempt ||
      attempt.tenantId !== params.data.tenantId ||
      attempt.campaignId !== params.data.campaignId ||
      attempt.debtorRecord.tenantId !== params.data.tenantId
    ) {
      return reply.code(404).send({ error: 'CALL_ATTEMPT_NOT_FOUND' });
    }

    const [
      complianceDecisions,
      usageEvents,
      rawCallEvents,
      rawTranscript,
      rawRecording,
      rawReconciliationIssues
    ] = await Promise.all([
      deps.complianceDecision?.findMany
        ? deps.complianceDecision.findMany({
            where: {
              tenantId: params.data.tenantId,
              campaignId: params.data.campaignId,
              debtorRecordId: attempt.debtorRecordId
            }
          })
        : Promise.resolve([]),
      deps.usageEvent?.findMany
        ? deps.usageEvent.findMany({
            where: {
              tenantId: params.data.tenantId,
              campaignId: params.data.campaignId,
              sourceId: {
                contains: attempt.providerCallId
              }
            },
            orderBy: {
              occurredAt: 'asc'
            }
          })
        : Promise.resolve([]),
      deps.callEvent?.findMany
        ? deps.callEvent.findMany({
            where: {
              tenantId: params.data.tenantId,
              callAttemptId: attempt.id
            },
            orderBy: {
              occurredAt: 'asc'
            }
          })
        : Promise.resolve([]),
      deps.callTranscript?.findFirst
        ? deps.callTranscript.findFirst({
            where: {
              tenantId: params.data.tenantId,
              callAttemptId: attempt.id
            }
          })
        : Promise.resolve(null),
      deps.callRecordingAsset?.findFirst
        ? deps.callRecordingAsset.findFirst({
            where: {
              tenantId: params.data.tenantId,
              callAttemptId: attempt.id
            }
          })
        : Promise.resolve(null),
      deps.callReconciliationIssue?.findMany
        ? deps.callReconciliationIssue.findMany({
            where: {
              tenantId: params.data.tenantId,
              callAttemptId: attempt.id
            },
            orderBy: {
              detectedAt: 'asc'
            }
          })
        : Promise.resolve([])
    ]);

    const callEvents = (rawCallEvents ?? []) as Array<{
      normalizedStatus?: string | null;
      rawStatus?: string | null;
      eventSource?: string | null;
      receivedAt?: string | Date | null;
    }>;
    const transcript = rawTranscript as ({ status?: string | null } & Record<string, unknown>) | null;
    const recording = rawRecording as ({ status?: string | null } & Record<string, unknown>) | null;
    const reconciliationIssues = (rawReconciliationIssues ?? []) as unknown[];
    const latestEvent = callEvents.at(-1);
    const dialStatus = attempt.dialStatus ?? attempt.status;
    const lifecycleEvidence = normalizeLifecycleEvidence({
      dialStatus,
      transcriptStatus: attempt.callResult?.transcriptStatus ?? transcript?.status ?? null,
      recordingStatus: attempt.callResult?.recordingStatus ?? recording?.status ?? null,
      reviewRequired: attempt.reviewRequired === true
    });
    const conversationStatus = deriveConversationStatusIfPossible({
      storedStatus: attempt.callResult?.conversationStatus,
      dialStatus,
      ...lifecycleEvidence
    });
    const result = {
      ...(attempt.callResult ?? {}),
      id: attempt.callResult?.id ?? null,
      outcome: attempt.callResult?.outcome ?? null,
      qaStatus: attempt.callResult?.qaStatus ?? null,
      conversationStatus,
      transcriptStatus: lifecycleEvidence.transcriptStatus,
      recordingStatus: lifecycleEvidence.recordingStatus
    };

    const complianceDecisionSummary = (() => {
      const decisions = (complianceDecisions ?? []) as Array<{
        decision?: string | null;
        reasonCode?: string | null;
        reasonText?: string | null;
        checkedAt?: string | Date | null;
      }>;
      if (!decisions.length) {
        return null;
      }
      const sorted = [...decisions].sort((left, right) => {
        const leftTs = left.checkedAt ? new Date(left.checkedAt).getTime() : 0;
        const rightTs = right.checkedAt ? new Date(right.checkedAt).getTime() : 0;
        return rightTs - leftTs;
      });
      const latest = sorted[0];
      if (!latest?.decision) {
        return null;
      }
      return toComplianceDecisionSummary({
        decision: latest.decision,
        reasonCode: latest.reasonCode,
        reasonText: latest.reasonText,
        checkedAt: latest.checkedAt
      });
    })();

    return reply.code(200).send({
      attempt: {
        id: attempt.id,
        tenantId: attempt.tenantId,
        campaignId: attempt.campaignId,
        debtorRecordId: attempt.debtorRecordId,
        status: attempt.status,
        dialStatus,
        reviewRequired: lifecycleEvidence.reviewRequired,
        telephonyConnectionId: attempt.telephonyConnectionId,
        scriptVersionId: attempt.scriptVersionId ?? null,
        providerCallId: attempt.providerCallId,
        identityVerified: attempt.identityVerified === true,
        identityVerifiedAt: attempt.identityVerifiedAt ?? null,
        startedAt: attempt.startedAt,
        endedAt: attempt.endedAt ?? null,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt
      },
      result,
      providerStatus: {
        normalized: latestEvent?.normalizedStatus ?? dialStatus ?? null,
        raw: latestEvent?.rawStatus ?? attempt.providerStatusRaw ?? null,
        source: latestEvent?.eventSource ?? 'legacy',
        receivedAt: latestEvent?.receivedAt ?? null
      },
      callEvents,
      transcript,
      recording,
      reconciliationIssues,
      complianceDecision: complianceDecisionSummary,
      complianceDecisions,
      usageEvents,
      evidenceBundle: {
        callResult: attempt.callResult ?? null,
        complianceDecisions,
        usageEvents,
        callEvents,
        transcript,
        recording,
        reconciliationIssues
      }
    });
  });
};
