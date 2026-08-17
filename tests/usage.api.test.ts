import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

type AppStore = {
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  campaign: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string; tenantId: string } | null>;
  };
  usageEvent?: {
    findMany: (query: {
      where: { tenantId: string; campaignId: string };
      skip?: number;
      take?: number;
      orderBy?: { occurredAt: 'asc' | 'desc' };
      select?: {
        eventType?: true;
        quantity?: true;
        unit?: true;
        occurredAt?: true;
        sourceId?: true;
      };
    }) => Promise<
      Array<{
        tenantId: string;
        campaignId: string;
        eventType: string;
        quantity: number;
        unit: string;
        sourceId: string;
        occurredAt: string;
      }>
    >;
  };
};

describe('GET /tenants/:tenantId/campaigns/:campaignId/usage-events', () => {
  const injectWithRole = async (app: { inject: (request: Record<string, unknown>) => Promise<{ statusCode: number; json: () => any }>; }, request: Record<string, unknown>, userRole = 'owner') =>
    app.inject({
      ...request,
      headers: {
        ...(request.headers as Record<string, string> | undefined),
        'x-user-role': userRole
      }
    });

  const injectWithOwnerRole = async (app: { inject: (request: Record<string, unknown>) => Promise<{ statusCode: number; json: () => any }>; }, request: Record<string, unknown>) =>
    injectWithRole(app, request, 'owner');

  const makeStore = (overrides: Partial<AppStore> = {}): AppStore => ({
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '00000000-0000-0000-0000-000000000000') {
          return null;
        }
        return { id: query.where.id };
      })
    },
    campaign: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === 'campaign-missing') {
          return null;
        }
        return {
          id: query.where.id,
          tenantId: query.where.id === '22222222-2222-2222-2222-222222222222' ? '22222222-2222-2222-2222-222222222222' : '11111111-1111-1111-1111-111111111111'
        };
      })
    },
    usageEvent: {
      findMany: vi.fn(async () => [])
    },
    ...overrides
  });

  it('returns tenant-scoped usage events with eventType, quantity, unit and occurredAt', async () => {
    const appStore = makeStore({
      usageEvent: {
        findMany: vi.fn(async () => [
          {
            id: 'usage-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_started',
            quantity: 1,
            unit: 'call',
            sourceId: 'provider-1',
            occurredAt: '2026-08-16T10:00:00.000Z'
          },
          {
            id: 'usage-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_completed',
            quantity: 1,
            unit: 'call',
            sourceId: 'provider-2',
            occurredAt: '2026-08-16T10:01:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        eventType: 'call_started',
        quantity: 1,
        unit: 'call',
        occurredAt: '2026-08-16T10:00:00.000Z'
      },
      {
        eventType: 'call_completed',
        quantity: 1,
        unit: 'call',
        occurredAt: '2026-08-16T10:01:00.000Z'
      }
    ]);

    expect(appStore.usageEvent?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '33333333-3333-3333-3333-333333333333'
      },
      skip: 0,
      take: 20,
      orderBy: {
        occurredAt: 'asc'
      },
      select: {
        eventType: true,
        quantity: true,
        unit: true,
        occurredAt: true
      }
    });

    await app.close();
  });

  it('uses default pagination for usage events list when limit and offset are omitted', async () => {
    const appStore = makeStore({
      usageEvent: {
        findMany: vi.fn(async ({ skip, take }) => {
          const events = Array.from({ length: 25 }, (_, index) => ({
            id: `usage-${index + 1}`,
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_started',
            quantity: 1,
            unit: 'call',
            sourceId: `provider-${index + 1}`,
            occurredAt: `2026-08-16T00:${String(index).padStart(2, '0')}:00.000Z`
          }));
          return events.slice(skip, skip + take);
        })
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<{ eventType: string; occurredAt: string }>;
    expect(body).toHaveLength(20);
    expect(body[0].occurredAt).toBe('2026-08-16T00:00:00.000Z');
    expect(body[19].occurredAt).toBe('2026-08-16T00:19:00.000Z');

    expect(appStore.usageEvent?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '33333333-3333-3333-3333-333333333333'
      },
      skip: 0,
      take: 20,
      orderBy: {
        occurredAt: 'asc'
      },
      select: {
        eventType: true,
        quantity: true,
        unit: true,
        occurredAt: true
      }
    });

    await app.close();
  });

  it('returns 400 when usage events list limit exceeds max', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events?limit=101'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when usage events list offset exceeds max', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events?offset=1001'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when campaign belongs to another tenant', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/usage-events'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'CAMPAIGN_NOT_FOUND' });

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/33333333-3333-3333-3333-333333333333/usage-events'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'TENANT_NOT_FOUND' });

    await app.close();
  });

  it('returns 401 when user role is missing for usage-events list', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'USER_ROLE_MISSING', message: 'X-User-Role header is required' });

    await app.close();
  });

  it('returns 403 when user role is forbidden for usage-events list', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await injectWithRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events'
    }, 'auditor');

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  it('returns usage event totals by eventType and unit', async () => {
    const appStore = makeStore({
      usageEvent: {
        findMany: vi.fn(async () => [
          {
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_started',
            quantity: 2,
            unit: 'call',
            sourceId: 'source-1',
            occurredAt: '2026-08-16T10:00:00.000Z'
          },
          {
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_started',
            quantity: 1,
            unit: 'call',
            sourceId: 'source-2',
            occurredAt: '2026-08-16T10:01:00.000Z'
          },
          {
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_started',
            quantity: 4,
            unit: 'call',
            sourceId: 'source-2',
            occurredAt: '2026-08-16T10:02:00.000Z'
          },
          {
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_completed',
            quantity: 1,
            unit: 'call',
            sourceId: 'source-3',
            occurredAt: '2026-08-16T10:03:00.000Z'
          },
          {
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '33333333-3333-3333-3333-333333333333',
            eventType: 'call_completed',
            quantity: 3,
            unit: 'minute',
            sourceId: 'source-4',
            occurredAt: '2026-08-16T10:04:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events/totals'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        eventType: 'call_completed',
        unit: 'call',
        totalQuantity: 1
      },
      {
        eventType: 'call_completed',
        unit: 'minute',
        totalQuantity: 3
      },
      {
        eventType: 'call_started',
        unit: 'call',
        totalQuantity: 3
      }
    ]);

    expect(appStore.usageEvent?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '33333333-3333-3333-3333-333333333333'
      },
      select: {
        sourceId: true,
        eventType: true,
        quantity: true,
        unit: true
      }
    });

    await app.close();
  });

  it('returns 404 when tenant does not exist for totals', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/33333333-3333-3333-3333-333333333333/usage-events/totals'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'TENANT_NOT_FOUND' });

    await app.close();
  });

  it('returns 404 when campaign belongs to another tenant for totals', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/usage-events/totals'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'CAMPAIGN_NOT_FOUND' });

    await app.close();
  });

  it('returns 401 when user role is missing for usage-events totals', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events/totals'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'USER_ROLE_MISSING', message: 'X-User-Role header is required' });

    await app.close();
  });

  it('returns 403 when user role is forbidden for usage-events totals', async () => {
    const app = createApp({ campaignStore: makeStore() as any });
    await app.ready();

    const response = await injectWithRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/usage-events/totals'
    }, 'auditor');

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});
