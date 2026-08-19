import { describe, expect, it, vi } from 'vitest';
import { createPrismaOutbox, dispatchOutboxBatch } from '../../src/integrations/outbox.js';

describe('transactional outbox', () => {
  it('marks a delivered event processed only after its handler succeeds', async () => {
    const update = vi.fn(async () => ({}));
    const outbox = createPrismaOutbox({
      outboxEvent: {
        findMany: vi.fn(async () => [{ id: 'event-1', eventType: 'campaign.status_changed', payload: {} }]),
        update,
        updateMany: vi.fn(async () => ({ count: 1 }))
      }
    } as any);

    await expect(dispatchOutboxBatch(outbox, 'worker-1', async () => undefined)).resolves.toEqual({ processed: 1, failed: 0 });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'event-1' },
      data: expect.objectContaining({ processedAt: expect.any(Date), lockedAt: null, lockedBy: null })
    }));
  });
});
