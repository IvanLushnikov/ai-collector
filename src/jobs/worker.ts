import { SANDBOX_START_JOB_NAME, type SandboxStartJobData } from './queue.js';
import { transitionDialogue, type DialogueState } from '../dialogue/state-machine.js';
import {
  createPrismaOutbox,
  dispatchOutboxBatch,
  type OutboxStore
} from '../integrations/outbox.js';
import { createPilotOutboxDeliverer } from '../integrations/outbox-deliver.js';

export const processHealthPing = async (): Promise<{ ok: true }> => ({ ok: true });

const blockedCampaignStatuses = new Set(['auto_paused', 'completed', 'archived']);

export const canRunSandboxStartJob = (campaignStatus: string): boolean =>
  !blockedCampaignStatuses.has(campaignStatus);

export const runSandboxOrchestratorStub = (input: {
  alreadyRecordedUsage?: boolean;
} = {}): { state: DialogueState; usageEventsCreated: number } => {
  const session = {
    state: 'identity' as DialogueState,
    identityVerified: true,
    debtAmount: 1000
  };
  const state = transitionDialogue(session, { type: 'tool_result', tool: 'end_call', ok: true });
  return {
    state,
    usageEventsCreated: input.alreadyRecordedUsage ? 0 : 0
  };
};

export const processSandboxStartJob = async (
  data: SandboxStartJobData
): Promise<{ ok: boolean; skipped?: string; job: string; orchestratorState?: DialogueState; usageEventsCreated?: number }> => {
  if (!canRunSandboxStartJob(data.campaignStatus)) {
    return {
      ok: false,
      skipped: data.campaignStatus,
      job: SANDBOX_START_JOB_NAME
    };
  }

  const orchestrator = runSandboxOrchestratorStub({ alreadyRecordedUsage: true });

  return {
    ok: true,
    job: SANDBOX_START_JOB_NAME,
    orchestratorState: orchestrator.state,
    usageEventsCreated: orchestrator.usageEventsCreated
  };
};

/** Drain durable outbox with the pilot deliverer (no live provider HTTP). */
export const processOutboxTick = async (
  store: OutboxStore,
  workerId: string,
  limit = 25
): Promise<{ processed: number; failed: number }> =>
  dispatchOutboxBatch(store, workerId, createPilotOutboxDeliverer(), limit);

export const createDefaultOutboxStore = (
  client: Parameters<typeof createPrismaOutbox>[0]
): OutboxStore => createPrismaOutbox(client);
