import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

const webhookSecret = 'test-webhook-secret';
const webhookSecretHash = 'd4d0f3c54b0f3c0b500bf62607b52f14d91882a1fa855c210f36e649cc32430c';
const authenticatedHeaders = {
  'x-telephony-webhook-secret': webhookSecret
};

describe('telephony webhook ingestion', () => {
  it('stores a provider event once and updates the linked call attempt', async () => {
    let inboxEvent: Record<string, unknown> | null = null;
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{ id: 'connection-1', webhookSecretHash }])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => inboxEvent),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          inboxEvent = data;
          return data;
        })
      },
      callAttempt: {
        findFirst: vi.fn(async () => ({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          providerCallId: 'provider-1',
          dialStatus: 'ringing'
        })),
        updateMany: vi.fn(async () => ({ count: 1 }))
      },
      callEvent: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) =>
          Object.assign({ id: 'event-1' }, data))
      }
    };

    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const request = {
      method: 'POST' as const,
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: authenticatedHeaders,
      payload: {
        eventId: 'evt-1',
        providerCallId: 'provider-1',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    };
    const firstResponse = await app.inject(request);
    const duplicateResponse = await app.inject(request);

    expect(firstResponse.statusCode).toBe(202);
    expect(firstResponse.json()).toEqual({
      accepted: true,
      duplicate: false,
      linked: true,
      callAttemptId: 'attempt-1',
      dialStatus: 'completed',
      terminal: true
    });
    expect(duplicateResponse.statusCode).toBe(202);
    expect(duplicateResponse.json()).toEqual({
      accepted: true,
      duplicate: true
    });
    expect(store.webhookInboxEvent.create).toHaveBeenCalledOnce();
    expect(store.callEvent.create).toHaveBeenCalledOnce();
    expect(store.callEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        callAttemptId: 'attempt-1',
        normalizedStatus: 'completed',
        rawStatus: 'completed',
        isTerminal: true
      })
    });
    expect(store.telephonyConnection.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        provider: 'mango',
        status: 'active'
      },
      select: {
        id: true,
        webhookSecretHash: true
      }
    });
    expect(store.callAttempt.updateMany).toHaveBeenCalledOnce();
    expect(store.callAttempt.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        dialStatus: 'completed',
        providerStatusRaw: 'completed',
        providerStatusUpdatedAt: new Date('2026-08-19T09:00:00.000Z'),
        lastEventAt: new Date('2026-08-19T09:00:00.000Z')
      })
    }));

    await app.close();
  });

  it('retries the event after a transactional lifecycle update failure', async () => {
    let inboxEvent: Record<string, unknown> | null = null;
    let eventWriteAttempts = 0;
    const store: Record<string, any> = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{ id: 'connection-1', webhookSecretHash }])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => inboxEvent),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          inboxEvent = data;
          return data;
        })
      },
      callAttempt: {
        findFirst: vi.fn(async () => ({ id: 'attempt-1' })),
        updateMany: vi.fn(async () => ({ count: 1 }))
      },
      callEvent: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          eventWriteAttempts += 1;
          if (eventWriteAttempts === 1) {
            throw new Error('temporary call event write failure');
          }
          return data;
        })
      }
    };
    store.$transaction = vi.fn(async (apply: (transactionStore: typeof store) => Promise<unknown>) => {
      const inboxSnapshot = inboxEvent;
      try {
        return await apply(store);
      } catch (error) {
        inboxEvent = inboxSnapshot;
        throw error;
      }
    });

    const app = createApp({ campaignStore: store });
    await app.ready();
    const request = {
      method: 'POST' as const,
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: authenticatedHeaders,
      payload: {
        eventId: 'evt-retry',
        providerCallId: 'provider-1',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    };

    const failedResponse = await app.inject(request);
    const retryResponse = await app.inject(request);

    expect(failedResponse.statusCode).toBe(500);
    expect(retryResponse.statusCode).toBe(202);
    expect(retryResponse.json()).toEqual(expect.objectContaining({
      accepted: true,
      duplicate: false,
      linked: true
    }));
    expect(store.$transaction).toHaveBeenCalledTimes(2);
    expect(store.callEvent.create).toHaveBeenCalledTimes(2);
    expect(store.callAttempt.updateMany).toHaveBeenCalledOnce();

    await app.close();
  });

  it('rejects a secret belonging to another tenant before lifecycle mutation', async () => {
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-victim' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{
          id: 'connection-victim',
          webhookSecretHash
        }])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(),
        create: vi.fn()
      },
      callAttempt: {
        findFirst: vi.fn(),
        updateMany: vi.fn()
      },
      callEvent: {
        create: vi.fn()
      }
    };
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-victim/telephony/webhooks/mango',
      headers: {
        'x-telephony-webhook-secret': 'other-tenant-secret'
      },
      payload: {
        eventId: 'evt-attack',
        providerCallId: 'provider-victim',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'INVALID_WEBHOOK_SECRET' });
    expect(store.tenant.findUnique).not.toHaveBeenCalled();
    expect(store.telephonyConnection.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-victim',
        provider: 'mango',
        status: 'active'
      },
      select: {
        id: true,
        webhookSecretHash: true
      }
    });
    expect(store.webhookInboxEvent.create).not.toHaveBeenCalled();
    expect(store.callAttempt.updateMany).not.toHaveBeenCalled();

    await app.close();
  });

  it('fails closed when the active tenant provider connection has no webhook secret hash', async () => {
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{
          id: 'connection-1',
          webhookSecretHash: null
        }])
      }
    };
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: {
        'x-telephony-webhook-secret': 'any-value'
      },
      payload: {
        eventId: 'evt-1',
        providerCallId: 'provider-1',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: 'TELEPHONY_WEBHOOK_NOT_CONFIGURED' });
    expect(store.tenant.findUnique).not.toHaveBeenCalled();

    await app.close();
  });

  it('fails closed when multiple active connections match the tenant and provider', async () => {
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [
          { id: 'connection-1', webhookSecretHash },
          { id: 'connection-2', webhookSecretHash }
        ])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => null),
        create: vi.fn()
      },
      callAttempt: {
        findFirst: vi.fn(async () => null),
        updateMany: vi.fn()
      },
      callEvent: {
        create: vi.fn()
      }
    };
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: authenticatedHeaders,
      payload: {
        eventId: 'evt-ambiguous-connection',
        providerCallId: 'provider-1',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: 'TELEPHONY_WEBHOOK_NOT_CONFIGURED' });
    expect(store.tenant.findUnique).not.toHaveBeenCalled();
    expect(store.webhookInboxEvent.create).not.toHaveBeenCalled();
    expect(store.callAttempt.findFirst).not.toHaveBeenCalled();
    expect(store.callAttempt.updateMany).not.toHaveBeenCalled();
    expect(store.callEvent.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('records an equal-timestamp event without overwriting the first applied lifecycle', async () => {
    const occurredAt = new Date('2026-08-19T09:00:00.000Z');
    let dialStatus = 'completed';
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{ id: 'connection-1', webhookSecretHash }])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
      },
      callAttempt: {
        findFirst: vi.fn(async () => ({
          id: 'attempt-1',
          tenantId: 'tenant-1',
          providerCallId: 'provider-1',
          dialStatus,
          providerStatusUpdatedAt: occurredAt
        })),
        updateMany: vi.fn(async ({ where, data }: {
          where: {
            OR: Array<{
              providerStatusUpdatedAt?: null | { lt?: Date; lte?: Date };
            }>;
          };
          data: { dialStatus: string };
        }) => {
          const timestampCondition = where.OR[1]?.providerStatusUpdatedAt;
          const applies = typeof timestampCondition === 'object'
            && timestampCondition !== null
            && (
              timestampCondition.lte?.getTime() === occurredAt.getTime()
              || (
                timestampCondition.lt instanceof Date
                && occurredAt.getTime() < timestampCondition.lt.getTime()
              )
            );
          if (applies) {
            dialStatus = data.dialStatus;
            return { count: 1 };
          }
          return { count: 0 };
        })
      },
      callEvent: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
      }
    };
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: authenticatedHeaders,
      payload: {
        eventId: 'evt-equal-timestamp',
        providerCallId: 'provider-1',
        status: 'ringing',
        occurredAt: occurredAt.toISOString()
      }
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      accepted: true,
      duplicate: false,
      linked: true,
      stale: true,
      callAttemptId: 'attempt-1',
      dialStatus: 'completed',
      terminal: true
    });
    expect(store.callEvent.create).toHaveBeenCalledOnce();
    expect(store.callEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        callAttemptId: 'attempt-1',
        normalizedStatus: 'ringing',
        occurredAt
      })
    });

    await app.close();
  });

  it('records an older provider event without regressing the current lifecycle', async () => {
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{ id: 'connection-1', webhookSecretHash }])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
      },
      callAttempt: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({
            id: 'attempt-1',
            tenantId: 'tenant-1',
            providerCallId: 'provider-1',
            dialStatus: 'ringing',
            providerStatusUpdatedAt: new Date('2026-08-19T08:00:00.000Z')
          })
          .mockResolvedValueOnce({
            id: 'attempt-1',
            tenantId: 'tenant-1',
            providerCallId: 'provider-1',
            dialStatus: 'completed',
            providerStatusUpdatedAt: new Date('2026-08-19T10:00:00.000Z')
          }),
        updateMany: vi.fn(async () => ({ count: 0 }))
      },
      callEvent: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
      }
    };
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: authenticatedHeaders,
      payload: {
        eventId: 'evt-older',
        providerCallId: 'provider-1',
        status: 'ringing',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      accepted: true,
      duplicate: false,
      linked: true,
      stale: true,
      callAttemptId: 'attempt-1',
      dialStatus: 'completed',
      terminal: true
    });
    expect(store.callEvent.create).toHaveBeenCalledOnce();
    expect(store.callAttempt.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        providerCallId: 'provider-1'
      }
    });
    expect(store.callAttempt.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'attempt-1',
        tenantId: 'tenant-1',
        OR: [
          { providerStatusUpdatedAt: null },
          {
            providerStatusUpdatedAt: {
              lt: new Date('2026-08-19T09:00:00.000Z')
            }
          }
        ]
      },
      data: {
        dialStatus: 'ringing',
        providerStatusRaw: 'ringing',
        providerStatusUpdatedAt: new Date('2026-08-19T09:00:00.000Z'),
        lastEventAt: new Date('2026-08-19T09:00:00.000Z')
      }
    });
    expect(store.callAttempt.findFirst).toHaveBeenCalledTimes(2);

    await app.close();
  });
});
