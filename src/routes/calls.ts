import { FastifyInstance, FastifyRequest } from 'fastify';
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
    findFirst?: (args: any) => Promise<unknown>;
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

const idempotencyKeySchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/);

const getIdempotencyKey = (request: FastifyRequest): string | null => {
  const raw = request.headers['idempotency-key'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = idempotencyKeySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002';

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
  recordingUrl?: string | null;
  transcriptUrl?: string | null;
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
      recordingUrl: input.recordingUrl,
      transcriptUrl: input.transcriptUrl
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

    const idempotencyKey = getIdempotencyKey(request);
    if (!idempotencyKey) {
      return reply.code(400).send({ error: 'IDEMPOTENCY_KEY_REQUIRED' });
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

    const priorAttempt = await deps.callAttempt.findFirst?.({
      where: {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId,
        idempotencyKey
      }
    }) as { id: string; status: string } | null | undefined;
    if (priorAttempt) {
      return reply.code(200).send({
        allowed: true,
        replayed: true,
        callStatus: priorAttempt.status,
        callAttempt: priorAttempt
      });
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
        reasons: decision.blockedReasons,
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
        return reply.code(409).send({ error: 'CAMPAIGN_JOB_BLOCKED' });
      }

      return reply.code(202).send({
        queued: true,
        job: createSandboxStartJob({
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          debtorRecordId: params.data.debtorRecordId,
          campaignStatus: campaign.status ?? 'draft',
          idempotencyKey
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
      phone: debtorRecord.phone,
      idempotencyKey
    });

    await createUsageEvent(deps.usageEvent, {
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      eventType: 'call_started',
      sourceId: `sandbox-call:${providerCall.providerCallId}:started`
    });

    let created: unknown;
    try {
      created = await deps.callAttempt.create({
        data: {
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          debtorRecordId: params.data.debtorRecordId,
          telephonyConnectionId: campaign.telephonyConnectionId ?? body.data.telephonyConnectionId ?? `${params.data.tenantId}-sandbox`,
          scriptVersionId: activeScript.id,
          status: mapVoiceStatusToCallAttemptStatus(providerCall.status),
          providerCallId: providerCall.providerCallId,
          idempotencyKey,
          identityVerified: false,
          identityVerifiedAt: null,
          startedAt: new Date(),
          endedAt: isTerminalCallStatus(providerCall.status) ? new Date() : undefined
        }
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      const concurrentAttempt = await deps.callAttempt.findFirst?.({
        where: { tenantId: params.data.tenantId, campaignId: params.data.campaignId, idempotencyKey }
      }) as { id: string; status: string } | null | undefined;
      if (concurrentAttempt) {
        return reply.code(200).send({ allowed: true, replayed: true, callStatus: concurrentAttempt.status, callAttempt: concurrentAttempt });
      }
      throw error;
    }

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

      // A live call must never silently degrade to sandbox. This route stays
      // closed until the configured provider has a reviewed HTTP adapter,
      // signed webhook ingress and legal/DPA approval.
      void request;
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
            qaStatus: true
          }
        }
      }
    }) as Array<{
      id: string;
      status: string;
      startedAt: string | Date;
      endedAt: string | Date | null;
      debtorRecord: { externalId: string } | null;
      callResult: { outcome: string; qaStatus?: string } | null;
    }> ) ?? [];

    return reply.code(200).send(
      attempts.map((attempt) => ({
        callAttemptId: attempt.id,
        status: attempt.status,
        debtorExternalId: attempt.debtorRecord?.externalId ?? null,
        startedAt: attempt.startedAt,
        endedAt: attempt.endedAt ?? null,
        outcome: attempt.callResult?.outcome ?? null
      }))
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

    const [complianceDecisions, usageEvents] = await Promise.all([
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
        : Promise.resolve([])
    ]);

    return reply.code(200).send({
      attempt: {
        id: attempt.id,
        tenantId: attempt.tenantId,
        campaignId: attempt.campaignId,
        debtorRecordId: attempt.debtorRecordId,
        status: attempt.status,
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
      result: attempt.callResult ?? null,
      complianceDecisions,
      usageEvents,
      evidenceBundle: {
        callResult: attempt.callResult ?? null,
        complianceDecisions,
        usageEvents
      }
    });
  });
};
