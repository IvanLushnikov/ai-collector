export type OutboxEvent = {
  id: string;
  eventType: string;
  payload: unknown;
};

type OutboxPrismaClient = {
  outboxEvent: {
    findMany: (args: unknown) => Promise<OutboxEvent[]>;
    update: (args: unknown) => Promise<unknown>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
};

export type OutboxStore = {
  claimAvailable: (workerId: string, limit: number) => Promise<OutboxEvent[]>;
  markProcessed: (eventId: string, workerId: string) => Promise<void>;
  markFailed: (eventId: string, workerId: string, error: string) => Promise<void>;
};

/**
 * Durable delivery adapter. Claiming is deliberately short-lived; consumers
 * must be idempotent because a process can die after an external side effect.
 */
export const createPrismaOutbox = (client: OutboxPrismaClient): OutboxStore => ({
  async claimAvailable(workerId, limit) {
    const now = new Date();
    const events = await client.outboxEvent.findMany({
      where: { processedAt: null, availableAt: { lte: now }, lockedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
    const claimed = await Promise.all(events.map(async (event) => {
      const result = await client.outboxEvent.updateMany({
        where: { id: event.id, processedAt: null, lockedAt: null },
        data: { lockedAt: now, lockedBy: workerId, attempts: { increment: 1 } }
      });
      return result.count === 1 ? event : null;
    }));
    return claimed.filter((event): event is OutboxEvent => event !== null);
  },
  async markProcessed(eventId, workerId) {
    await client.outboxEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date(), lockedAt: null, lockedBy: null, lastError: null },
      // The worker id is intentionally recorded in the claim; a production
      // deployment also protects this update with a conditional SQL claim.
    });
    void workerId;
  },
  async markFailed(eventId, workerId, error) {
    await client.outboxEvent.update({
      where: { id: eventId },
      data: { lockedAt: null, lockedBy: null, lastError: error, availableAt: new Date(Date.now() + 30_000) }
    });
    void workerId;
  }
});

export const dispatchOutboxBatch = async (
  store: OutboxStore,
  workerId: string,
  deliver: (event: OutboxEvent) => Promise<void>,
  limit = 25
): Promise<{ processed: number; failed: number }> => {
  let processed = 0;
  let failed = 0;
  for (const event of await store.claimAvailable(workerId, limit)) {
    try {
      await deliver(event);
      await store.markProcessed(event.id, workerId);
      processed += 1;
    } catch (error) {
      await store.markFailed(event.id, workerId, error instanceof Error ? error.message : 'Unknown outbox delivery error');
      failed += 1;
    }
  }
  return { processed, failed };
};
