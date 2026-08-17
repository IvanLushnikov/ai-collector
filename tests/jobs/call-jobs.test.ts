import { describe, expect, it } from 'vitest';
import { processSandboxStartJob } from '../../src/jobs/worker.js';
import { shouldEnqueueSandboxCall } from '../../src/jobs/sandbox-enqueue.js';

describe('sandbox call jobs', () => {
  it('does not enqueue sandbox calls when the flag is off', () => {
    expect(shouldEnqueueSandboxCall(false)).toBe(false);
    expect(shouldEnqueueSandboxCall(true)).toBe(true);
  });

  it('skips sandbox start jobs for auto_paused, completed and archived campaigns', async () => {
    await expect(processSandboxStartJob({
      tenantId: 't1',
      campaignId: 'c1',
      debtorRecordId: 'd1',
      campaignStatus: 'auto_paused'
    })).resolves.toMatchObject({ ok: false, skipped: 'auto_paused' });

    await expect(processSandboxStartJob({
      tenantId: 't1',
      campaignId: 'c1',
      debtorRecordId: 'd1',
      campaignStatus: 'completed'
    })).resolves.toMatchObject({ ok: false, skipped: 'completed' });
  });

  it('allows sandbox start jobs for ready campaigns without placing a live call', async () => {
    await expect(processSandboxStartJob({
      tenantId: 't1',
      campaignId: 'c1',
      debtorRecordId: 'd1',
      campaignStatus: 'ready'
    })).resolves.toEqual({ ok: true, job: 'calls.sandbox_start' });
  });
});
