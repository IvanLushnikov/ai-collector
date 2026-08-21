import { describe, expect, it, vi } from 'vitest';
import { createPrismaOutbox, dispatchOutboxBatch } from '../../src/integrations/outbox.js';

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

  it('reclaims only expired leases and never completes another worker claim', async () => {
    const findMany = vi.fn(async () => []);
    const updateMany = vi.fn(async () => ({ count: 0 }));
    const outbox = createPrismaOutbox({
      outboxEvent: { findMany, update: vi.fn(async () => ({})), updateMany }
    } as any);

    await outbox.claimAvailable('worker-2', 10);
    await outbox.markProcessed('event-1', 'worker-2');
    await outbox.markFailed('event-1', 'worker-2', 'delivery failed');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([{ lockedAt: null }, { lockedAt: { lt: expect.any(Date) } }])
      })
    }));
    expect(updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({ id: 'event-1', processedAt: null, lockedBy: 'worker-2' })
    }));
    expect(updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ id: 'event-1', processedAt: null, lockedBy: 'worker-2' })
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
});
