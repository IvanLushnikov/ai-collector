import { describe, expect, it } from 'vitest';
import { CALL_QUEUE_NAME, createPingJob, createQueue, PING_JOB_NAME } from '../../src/jobs/queue.js';
import { processHealthPing } from '../../src/jobs/worker.js';

describe('jobs queue skeleton', () => {
  it('builds a health ping job without calling telephony', () => {
    expect(createPingJob()).toEqual({
      name: PING_JOB_NAME,
      data: { source: 'worker-health' }
    });
  });

  it('creates a queue object in memory without dialing', async () => {
    const queue = createQueue(CALL_QUEUE_NAME, {
      host: '127.0.0.1',
      port: 6379
    });

    expect(queue.name).toBe(CALL_QUEUE_NAME);
    expect(typeof queue.add).toBe('function');
    await queue.close();
  });

  it('processes health ping locally without Redis', async () => {
    await expect(processHealthPing()).resolves.toEqual({ ok: true });
  });
});
