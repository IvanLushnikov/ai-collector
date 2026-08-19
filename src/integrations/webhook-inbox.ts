export type WebhookInboxRecord = {
  tenantId: string;
  sourceSystem: string;
  eventId: string;
};

export type WebhookInboxStore = {
  insertIfNew: (record: WebhookInboxRecord) => Promise<{ duplicate: boolean }>;
};

type WebhookInboxPrismaClient = {
  webhookInboxEvent: {
    create: (args: unknown) => Promise<unknown>;
  };
};

const isUniqueConstraintError = (error: unknown): boolean => {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: unknown }).code === 'P2002';
};

/** Durable inbox adapter. The database unique index is the repeat-delivery gate. */
export const createPrismaWebhookInbox = (client: WebhookInboxPrismaClient): WebhookInboxStore => ({
  async insertIfNew(record) {
    try {
      await client.webhookInboxEvent.create({ data: record });
      return { duplicate: false };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return { duplicate: true };
      }
      throw error;
    }
  }
});

export const createInMemoryWebhookInbox = (): WebhookInboxStore => {
  const seen = new Set<string>();
  const keyOf = (record: WebhookInboxRecord) =>
    `${record.tenantId}::${record.sourceSystem}::${record.eventId}`;

  return {
    async insertIfNew(record) {
      const key = keyOf(record);
      if (seen.has(key)) {
        return { duplicate: true };
      }
      seen.add(key);
      return { duplicate: false };
    }
  };
};

export const applyWebhookEvent = async <T>(
  inbox: WebhookInboxStore,
  record: WebhookInboxRecord,
  apply: () => Promise<T>
): Promise<{ duplicate: boolean; result: T | null }> => {
  const inserted = await inbox.insertIfNew(record);
  if (inserted.duplicate) {
    return { duplicate: true, result: null };
  }
  return { duplicate: false, result: await apply() };
};
