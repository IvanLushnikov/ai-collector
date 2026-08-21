export type OutboxEvent = {
  id: string;
  eventType: string;
  payload: unknown;
  attempts?: number;
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
  markFailed: (eventId: string, workerId: string, error: string, attemptNumber?: number) => Promise<void>;
};

const OUTBOX_LEASE_MS = 60_000;
const OUTBOX_MAX_ATTEMPTS = 10;
const OUTBOX_RETRY_BASE_MS = 30_000;
const OUTBOX_RETRY_MAX_MS = 30 * 60_000;

const retryDelayMs = (attempts: number): number =>
  Math.min(OUTBOX_RETRY_BASE_MS * (2 ** Math.max(0, attempts - 1)), OUTBOX_RETRY_MAX_MS);

/**
 * Durable delivery adapter. Claiming is deliberately short-lived; consumers
 * must be idempotent because a process can die after an external side effect.
 */
export const createPrismaOutbox = (client: OutboxPrismaClient): OutboxStore => ({
  async claimAvailable(workerId, limit) {
    const now = new Date();
    const leaseExpiredAt = new Date(now.getTime() - OUTBOX_LEASE_MS);
    const events = await client.outboxEvent.findMany({
      where: {
        processedAt: null,
        deadLetteredAt: null,
        availableAt: { lte: now },
        OR: [{ lockedAt: null }, { lockedAt: { lt: leaseExpiredAt } }]
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
    const claimed = await Promise.all(events.map(async (event) => {
      const result = await client.outboxEvent.updateMany({
        where: {
          id: event.id,
          processedAt: null,
          deadLetteredAt: null,
          availableAt: { lte: now },
          OR: [{ lockedAt: null }, { lockedAt: { lt: leaseExpiredAt } }]
        },
        data: { lockedAt: now, lockedBy: workerId, attempts: { increment: 1 } }
      });
      return result.count === 1 ? event : null;
    }));
    return claimed.filter((event): event is OutboxEvent => event !== null);
  },
  async markProcessed(eventId, workerId) {
    const result = await client.outboxEvent.updateMany({
      where: { id: eventId, processedAt: null, lockedBy: workerId },
      data: { processedAt: new Date(), lockedAt: null, lockedBy: null, lastError: null },
    });
    if (result.count !== 1) {
      throw new Error(`OUTBOX_LEASE_OWNERSHIP_MISMATCH:processed:${eventId}`);
    }
  },
  async markFailed(eventId, workerId, error, attemptNumber = 1) {
    const now = new Date();
    const deadLettered = await client.outboxEvent.updateMany({
      where: { id: eventId, processedAt: null, lockedBy: workerId, attempts: { gte: OUTBOX_MAX_ATTEMPTS } },
      data: { lockedAt: null, lockedBy: null, lastError: error, deadLetteredAt: now }
    });
    if (deadLettered.count === 1) {
      return;
    }

    const retried = await client.outboxEvent.updateMany({
      where: { id: eventId, processedAt: null, lockedBy: workerId, attempts: { lt: OUTBOX_MAX_ATTEMPTS } },
      data: { lockedAt: null, lockedBy: null, lastError: error, availableAt: new Date(now.getTime() + retryDelayMs(attemptNumber)) }
    });
    if (retried.count !== 1) {
      throw new Error(`OUTBOX_LEASE_OWNERSHIP_MISMATCH:failed:${eventId}`);
    }
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
      await store.markFailed(
        event.id,
        workerId,
        error instanceof Error ? error.message : 'Unknown outbox delivery error',
        Number(event.attempts ?? 0) + 1
      );
      failed += 1;
    }
  }
  return { processed, failed };
};
