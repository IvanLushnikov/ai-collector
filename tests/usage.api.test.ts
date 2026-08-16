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

    const response = await app.inject({
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

  it('returns 404 when campaign belongs to another tenant', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
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

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/33333333-3333-3333-3333-333333333333/usage-events'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'TENANT_NOT_FOUND' });

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

    const response = await app.inject({
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

    const response = await app.inject({
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

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/usage-events/totals'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'CAMPAIGN_NOT_FOUND' });

    await app.close();
  });
});
