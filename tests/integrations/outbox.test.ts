import { describe, expect, it, vi } from 'vitest';
import { createPrismaOutbox, dispatchOutboxBatch } from '../../src/integrations/outbox.js';
import { createPilotOutboxDeliverer } from '../../src/integrations/outbox-deliver.js';
import { processOutboxTick } from '../../src/jobs/worker.js';

describe('transactional outbox', () => {
  it('marks a delivered event processed only after its handler succeeds', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const outbox = createPrismaOutbox({
      outboxEvent: {
        findMany: vi.fn(async () => [{ id: 'event-1', eventType: 'campaign.status_changed', payload: {} }]),
        update: vi.fn(async () => ({})),
        updateMany
      }
    } as any);

    await expect(dispatchOutboxBatch(outbox, 'worker-1', async () => undefined)).resolves.toEqual({ processed: 1, failed: 0 });
    expect(updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { id: 'event-1', processedAt: null, lockedBy: 'worker-1' },
      data: expect.objectContaining({ processedAt: expect.any(Date), lockedAt: null, lockedBy: null })
    }));
  });

  it('reclaims only expired leases and requires ownership on finish', async () => {
    const findMany = vi.fn(async () => []);
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const outbox = createPrismaOutbox({
      outboxEvent: { findMany, update: vi.fn(async () => ({})), updateMany }
    } as any);

    await outbox.claimAvailable('worker-2', 10);
    await expect(outbox.markProcessed('event-1', 'worker-2')).rejects.toThrow('OUTBOX_LEASE_OWNERSHIP_MISMATCH:processed');
    await expect(outbox.markFailed('event-1', 'worker-2', 'delivery failed')).rejects.toThrow('OUTBOX_LEASE_OWNERSHIP_MISMATCH:failed');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        availableAt: { lte: expect.any(Date) },
        OR: expect.arrayContaining([{ lockedAt: null }, { lockedAt: { lt: expect.any(Date) } }])
      })
    }));
  });

  it('includes availableAt in claim updateMany for race-safe lease takeovers', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const outbox = createPrismaOutbox({
      outboxEvent: {
        findMany: vi.fn(async () => [{ id: 'event-1', eventType: 'campaign.created', payload: {} }]),
        update: vi.fn(async () => ({})),
        updateMany
      }
    } as any);

    await outbox.claimAvailable('worker-9', 1);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'event-1',
        availableAt: { lte: expect.any(Date) }
      })
    }));
  });

  it('dead-letters an event after the retry limit instead of retrying it forever', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const outbox = createPrismaOutbox({
      outboxEvent: {
        findMany: vi.fn(async () => [{ id: 'event-1', eventType: 'campaign.status_changed', payload: {}, attempts: 9 }]),
        update: vi.fn(async () => ({})),
        updateMany
      }
    } as any);

    await expect(dispatchOutboxBatch(outbox, 'worker-1', async () => {
      throw new Error('provider unavailable');
    })).resolves.toEqual({ processed: 0, failed: 1 });

    expect(updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { id: 'event-1', processedAt: null, lockedBy: 'worker-1', attempts: { gte: 10 } },
      data: expect.objectContaining({ deadLetteredAt: expect.any(Date), lastError: 'provider unavailable' })
    }));
  });

  it('pilot deliverer acks known event types and rejects unknown ones', async () => {
    const deliver = createPilotOutboxDeliverer();
    await expect(deliver({ id: '1', eventType: 'campaign.created', payload: {} })).resolves.toBeUndefined();
    await expect(deliver({ id: '2', eventType: 'telephony.live.forward', payload: {} }))
      .rejects.toThrow('UNKNOWN_OUTBOX_EVENT_TYPE:telephony.live.forward');
  });

  it('processOutboxTick drains with the pilot deliverer', async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const store = createPrismaOutbox({
      outboxEvent: {
        findMany: vi.fn(async () => [{ id: 'event-1', eventType: 'script_version.created', payload: {} }]),
        update: vi.fn(async () => ({})),
        updateMany
      }
    } as any);

    await expect(processOutboxTick(store, 'worker-tick')).resolves.toEqual({ processed: 1, failed: 0 });
  });
});
