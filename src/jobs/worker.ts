import { SANDBOX_START_JOB_NAME, type SandboxStartJobData } from './queue.js';

export const processHealthPing = async (): Promise<{ ok: true }> => ({ ok: true });

const blockedCampaignStatuses = new Set(['auto_paused', 'completed', 'archived']);

export const canRunSandboxStartJob = (campaignStatus: string): boolean =>
  !blockedCampaignStatuses.has(campaignStatus);

export const processSandboxStartJob = async (
  data: SandboxStartJobData
): Promise<{ ok: boolean; skipped?: string; job: string }> => {
  if (!canRunSandboxStartJob(data.campaignStatus)) {
    return {
      ok: false,
      skipped: data.campaignStatus,
      job: SANDBOX_START_JOB_NAME
    };
  }

  return {
    ok: true,
    job: SANDBOX_START_JOB_NAME
  };
};
