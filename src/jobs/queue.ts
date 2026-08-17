import { Queue, type ConnectionOptions } from 'bullmq';

export const HEALTH_QUEUE_NAME = 'health';
export const CALL_QUEUE_NAME = 'calls';
export const PING_JOB_NAME = 'health.ping';
export const SANDBOX_START_JOB_NAME = 'calls.sandbox_start';

export type PingJobData = {
  source: 'worker-health';
};

export type SandboxStartJobData = {
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  campaignStatus: string;
};

export const createPingJob = (): { name: string; data: PingJobData } => ({
  name: PING_JOB_NAME,
  data: { source: 'worker-health' }
});

export const createSandboxStartJob = (data: SandboxStartJobData): { name: string; data: SandboxStartJobData } => ({
  name: SANDBOX_START_JOB_NAME,
  data
});

export const createQueue = (
  name: string,
  connection: ConnectionOptions
): Queue => new Queue(name, { connection });
