import { describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env.js';
import { createApp } from '../src/server/app.js';

type TenantStore = {
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string; connectedMinuteRateRub: number | null } | null>;
    update: (query: { where: { id: string }; data: { connectedMinuteRateRub: number | null } }) => Promise<{ id: string; connectedMinuteRateRub: number | null }>;
  };
  user: {
    findFirst: (query: { where: { tenantId: string; isActive: boolean; status: string } }) => Promise<{ id: string } | null>;
  };
  auditLog?: {
    create: (query: {
      data: {
        tenantId: string;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }) => Promise<unknown>;
  };
};

const makeStore = (overrides: Partial<TenantStore> = {}): TenantStore => ({
  tenant: {
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === '00000000-0000-0000-0000-000000000000') {
        return null;
      }
      return {
        id: query.where.id,
        connectedMinuteRateRub: 1.2
      };
    }),
    update: vi.fn(async (query: { where: { id: string }; data: { connectedMinuteRateRub: number | null } }) => {
      return {
        id: query.where.id,
        connectedMinuteRateRub: query.data.connectedMinuteRateRub
      };
    })
  },
  user: {
    findFirst: vi.fn(async () => ({ id: 'operator-user-id' }))
  },
  auditLog: {
    create: vi.fn(async () => ({}))
  },
  ...overrides
});

describe('GET /tenants/:tenantId/billing/settings', () => {
  it('returns tenant billing settings with resolved fallback', async () => {
    const appStore = makeStore({
      tenant: {
        findUnique: vi.fn(async (query: { where: { id: string } }) => {
          if (query.where.id === '00000000-0000-0000-0000-000000000000') {
            return null;
          }
          return {
            id: query.where.id,
            connectedMinuteRateRub: null
          };
        }),
        update: vi.fn(async () => ({ id: 'tenant-id', connectedMinuteRateRub: null }))
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/billing/settings'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      connectedMinuteRateRub: null,
      resolvedConnectedMinuteRateRub: env.BILLING_CONNECTED_MINUTE_RATE_RUB
    });

    await app.close();
  });

  it('returns 404 for missing tenant', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/billing/settings'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'TENANT_NOT_FOUND' });

    await app.close();
  });

  it('returns 400 on invalid tenant id', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/not-a-uuid/billing/settings'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });
});

describe('PATCH /tenants/:tenantId/billing/settings', () => {
  it('updates tenant billing settings and writes audit log', async () => {
    const appStore = makeStore({
      tenant: {
        findUnique: vi.fn(async (query: { where: { id: string } }) => {
          if (query.where.id === '00000000-0000-0000-0000-000000000000') {
            return null;
          }
          return {
            id: query.where.id,
            connectedMinuteRateRub: 1.2
          };
        }),
        update: vi.fn(async (query: { where: { id: string }; data: { connectedMinuteRateRub: number | null } }) => ({
          id: query.where.id,
          connectedMinuteRateRub: query.data.connectedMinuteRateRub
        }))
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/billing/settings',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        connectedMinuteRateRub: 2.75
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      connectedMinuteRateRub: 2.75
    });
    expect(appStore.tenant.update).toHaveBeenCalledWith({
      where: { id: '11111111-1111-1111-1111-111111111111' },
      data: { connectedMinuteRateRub: 2.75 }
    });
    expect(appStore.auditLog?.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'operator-user-id',
        action: 'tenant.billing_settings_updated',
        entityType: 'tenant',
        entityId: '11111111-1111-1111-1111-111111111111',
        metadata: {
          previousConnectedMinuteRateRub: 1.2,
          connectedMinuteRateRub: 2.75,
          sourceRoute: '/tenants/:tenantId/billing/settings'
        }
      }
    });

    await app.close();
  });

  it('resets tenant billing override when null is passed', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/billing/settings',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        connectedMinuteRateRub: null
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().connectedMinuteRateRub).toBe(null);

    await app.close();
  });

  it('returns 422 when tenant has no active user', async () => {
    const app = createApp({
      campaignStore: makeStore({
        user: {
          findFirst: vi.fn(async () => null)
        }
      }) as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/billing/settings',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        connectedMinuteRateRub: 2
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ error: 'NO_ACTIVE_USER_FOR_TENANT' });

    await app.close();
  });

  it('returns 400 for invalid payload', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/billing/settings',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        connectedMinuteRateRub: -1
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('forbids users without allowed role', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/billing/settings',
      headers: {
        'x-user-role': 'operator'
      },
      payload: {
        connectedMinuteRateRub: 2
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});
