export type DomainOutboxWrite = {
  tenantId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
};

type OutboxCreateStore = {
  outboxEvent?: {
    create?: (args: { data: DomainOutboxWrite }) => Promise<unknown>;
  };
};

/** Append a durable outbox row when the store supports it (same TX as domain+audit). */
export const appendOutboxEvent = async (
  store: OutboxCreateStore,
  event: DomainOutboxWrite
): Promise<void> => {
  await store.outboxEvent?.create?.({ data: event });
};
