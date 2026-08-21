import type { CallAttemptStatus } from '../domain/call-attempt/index.js';
import type { VoiceCallStatus } from '../telephony/voice-provider/adapter.js';
import type { VoiceProviderResolver } from '../telephony/voice-provider/resolver.js';

export const ACTIVE_CALL_ATTEMPT_STATUSES: CallAttemptStatus[] = [
  'initiated',
  'queued',
  'ringing',
  'answered'
];

/** Providers whose hangupCall works without live telephony HTTP (Exolve HTTP = T-149). */
export const FORCE_STOP_HANGUP_PROVIDERS = new Set(['sandbox']);

export type ForceStopInterruptAttempt = {
  id: string;
  providerCallId: string;
  telephonyConnectionId: string;
  status: CallAttemptStatus;
};

export type ForceStopInterruptDeps = {
  callAttempt?: {
    findMany?: (args: unknown) => Promise<unknown>;
    update?: (args: unknown) => Promise<unknown>;
  };
  telephonyConnection?: {
    findUnique?: (args: unknown) => Promise<unknown>;
  };
  voiceProviderResolver?: VoiceProviderResolver;
};

export type ForceStopInterruptResult = {
  attempted: number;
  interrupted: number;
  skippedProvider: number;
  errors: number;
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

export const interruptActiveCallAttempts = async (
  deps: ForceStopInterruptDeps,
  input: { tenantId: string; campaignId: string }
): Promise<ForceStopInterruptResult> => {
  const result: ForceStopInterruptResult = {
    attempted: 0,
    interrupted: 0,
    skippedProvider: 0,
    errors: 0
  };

  if (!deps.callAttempt?.findMany || !deps.voiceProviderResolver) {
    return result;
  }

  const rawAttempts = await deps.callAttempt.findMany({
    where: {
      tenantId: input.tenantId,
      campaignId: input.campaignId,
      status: { in: ACTIVE_CALL_ATTEMPT_STATUSES }
    },
    select: {
      id: true,
      providerCallId: true,
      telephonyConnectionId: true,
      status: true
    }
  }) as ForceStopInterruptAttempt[];

  result.attempted = rawAttempts.length;

  for (const attempt of rawAttempts) {
    const connection = await deps.telephonyConnection?.findUnique?.({
      where: { id: attempt.telephonyConnectionId }
    }) as { provider?: string } | null | undefined;

    const providerKey = connection?.provider ?? 'sandbox';

    if (!FORCE_STOP_HANGUP_PROVIDERS.has(providerKey)) {
      result.skippedProvider += 1;
      continue;
    }

    try {
      const voiceProvider = deps.voiceProviderResolver.resolve(providerKey);
      const hangupResult = await voiceProvider.hangupCall(attempt.providerCallId);

      if (deps.callAttempt.update) {
        await deps.callAttempt.update({
          where: { id: attempt.id },
          data: {
            status: mapVoiceStatusToCallAttemptStatus(hangupResult.status),
            endedAt: new Date(),
            disconnectInitiator: 'campaign_force_stop'
          }
        });
      }

      result.interrupted += 1;
    } catch {
      result.errors += 1;
    }
  }

  return result;
};
