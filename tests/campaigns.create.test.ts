import { expect, it, describe, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

const makeCampaignStore = () => ({
  tenant: {
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === '00000000-0000-0000-0000-000000000000') {
        return null;
      }
      return { id: query.where.id };
    })
  },
  user: {
    findFirst: vi.fn(async () => ({ id: 'user-1' }))
  },
  campaign: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'campaign-1',
      tenantId: data.tenantId as string,
      name: data.name as string,
      status: 'draft',
      timezone: data.timezone as string,
      createdByUserId: data.createdByUserId as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    findMany: vi.fn(async () => [] as Array<{
      id: string;
      name: string;
      status: string;
      timezone: string;
      createdAt: string;
    }>),
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === 'campaign-missing') {
        return null;
      }
      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: `Campaign ${query.where.id}`,
        status: 'ready',
        timezone: 'UTC',
        createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
      };
    }),
    update: vi.fn(async ({ data, where }: { data: { status: string }; where: { id: string } }) => ({
      id: where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: `Campaign ${where.id}`,
      status: data.status,
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }))
  },
  auditLog: {
    create: vi.fn(async () => ({
      id: 'audit-1'
    }))
  },
  debtorRecord: {
    count: vi.fn(async () => 2)
  },
  callAttempt: {
    count: vi.fn(async () => 5)
  },
  complianceDecision: {
    count: vi.fn(async () => 1)
  }
});

describe('POST /campaigns', () => {
  const authorizedRole = 'owner';

  it('creates campaign in draft state', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });

    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Pilot campaign',
        timezone: 'Europe/Moscow'
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toMatchObject({
      id: 'campaign-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Pilot campaign',
      status: 'draft',
      timezone: 'Europe/Moscow',
      createdByUserId: 'user-1'
    });
    expect(campaignStore.campaign.create).toHaveBeenCalledOnce();
    expect(campaignStore.auditLog.create).toHaveBeenCalledOnce();
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        action: 'campaign.created',
        entityType: 'campaign',
        entityId: 'campaign-1',
        metadata: expect.objectContaining({
          source: 'api',
          sourceRoute: '/campaigns'
        })
      })
    });

    await app.close();
  });

  it('rejects missing user role header', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Pilot campaign',
        timezone: 'Europe/Moscow'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role for campaign creation', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: {
        'X-User-Role': 'operator'
      },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Pilot campaign',
        timezone: 'Europe/Moscow'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  it('uses tenant id from X-Tenant-Id header', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: {
        'X-Tenant-Id': '22222222-2222-2222-2222-222222222222',
        'X-User-Role': authorizedRole
      },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Header campaign',
        timezone: 'Europe/Moscow'
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.tenantId).toBe('22222222-2222-2222-2222-222222222222');
    expect(campaignStore.campaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: '22222222-2222-2222-2222-222222222222'
        })
      })
    );

    expect(campaignStore.auditLog.create).toHaveBeenCalledOnce();
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '22222222-2222-2222-2222-222222222222',
        userId: 'user-1',
        action: 'campaign.created',
        entityType: 'campaign',
        entityId: 'campaign-1'
      })
    });

    await app.close();
  });

  it('returns 400 on validation error', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        name: 'No tenant'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('TENANT_CONTEXT_MISSING');

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        name: 'Missing tenant',
        timezone: 'UTC'
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });
});

describe('GET /tenants/:tenantId/campaigns', () => {
  it('returns tenant campaigns sorted by createdAt in ascending order', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findMany = vi.fn(async () => [
      {
        id: 'campaign-old',
        name: 'Old campaign',
        status: 'draft',
        timezone: 'Europe/Moscow',
        createdAt: '2026-08-10T10:00:00.000Z'
      },
      {
        id: 'campaign-new',
        name: 'New campaign',
        status: 'ready',
        timezone: 'UTC',
        createdAt: '2026-08-16T10:00:00.000Z'
      }
    ]);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toEqual([
      {
        id: 'campaign-old',
        name: 'Old campaign',
        status: 'draft',
        timezone: 'Europe/Moscow',
        createdAt: '2026-08-10T10:00:00.000Z'
      },
      {
        id: 'campaign-new',
        name: 'New campaign',
        status: 'ready',
        timezone: 'UTC',
        createdAt: '2026-08-16T10:00:00.000Z'
      }
    ]);
    expect(campaignStore.campaign.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        timezone: true,
        createdAt: true
      }
    });

    await app.close();
  });

  it('does not return campaigns for other tenants', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findMany = vi.fn(async () => [
      {
        id: 'campaign-only',
        name: 'Only this tenant',
        status: 'draft',
        timezone: 'UTC',
        createdAt: '2026-08-16T09:00:00.000Z'
      }
    ]);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual([
      {
        id: 'campaign-only',
        name: 'Only this tenant',
        status: 'draft',
        timezone: 'UTC',
        createdAt: '2026-08-16T09:00:00.000Z'
      }
    ]);

    expect(campaignStore.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: '11111111-1111-1111-1111-111111111111' }
    });
    expect(campaignStore.campaign.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        timezone: true,
        createdAt: true
      }
    });

    await app.close();
  });

  it('returns 400 on invalid tenantId', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/not-a-uuid/campaigns'
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns'
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });
});

describe('GET /tenants/:tenantId/campaigns/:campaignId', () => {
  it('returns campaign details with aggregates from counts', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === 'campaign-abc') {
        return {
          id: 'campaign-abc',
          tenantId: '11111111-1111-1111-1111-111111111111',
          name: 'Campaign abc',
          status: 'ready',
          timezone: 'UTC',
          createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
        };
      }
      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: `Campaign ${query.where.id}`,
        status: 'ready',
        timezone: 'UTC',
        createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
      };
    });
    campaignStore.debtorRecord.count = vi.fn(async () => 3);
    campaignStore.callAttempt.count = vi.fn(async () => 4);
    campaignStore.complianceDecision.count = vi.fn(async () => 1);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-abc'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body).toEqual({
      id: 'campaign-abc',
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign abc',
      status: 'ready',
      timezone: 'UTC',
      createdAt: '2026-08-16T09:00:00.000Z',
      debtorRecordsCount: 3,
      callAttemptsCount: 4,
      complianceBlocksCount: 1
    });

    expect(campaignStore.debtorRecord.count).toHaveBeenCalledWith({ where: { campaignId: 'campaign-abc' } });
    expect(campaignStore.callAttempt.count).toHaveBeenCalledWith({ where: { campaignId: 'campaign-abc' } });
    expect(campaignStore.complianceDecision.count).toHaveBeenCalledWith({
      where: {
        campaignId: 'campaign-abc',
        decision: 'block'
      }
    });

    await app.close();
  });

  it('returns 404 when campaign belongs to other tenant', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async () => ({
      id: 'campaign-other',
      tenantId: '22222222-2222-2222-2222-222222222222',
      name: 'Other tenant campaign',
      status: 'ready',
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-other'
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('CAMPAIGN_NOT_FOUND');

    await app.close();
  });

  it('returns 404 when campaign does not exist', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async () => null);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-missing'
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('CAMPAIGN_NOT_FOUND');

    await app.close();
  });
});

describe('PATCH /tenants/:tenantId/campaigns/:campaignId/status', () => {
  it('updates campaign status for valid transition', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign draft',
      status: 'draft',
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.campaign.update = vi.fn(async ({ data, where }: { data: { status: string }; where: { id: string } }) => ({
      id: where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign draft',
      status: data.status,
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-draft/status',
      payload: {
        status: 'review'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('review');
    expect(campaignStore.campaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-draft' },
      data: { status: 'review' },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        timezone: true,
        createdAt: true
      }
    });

    await app.close();
  });

  it('returns 400 for invalid status transition', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign draft',
      status: 'draft',
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-draft/status',
      payload: {
        status: 'completed'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');

    await app.close();
  });

  it('returns 400 for invalid status payload', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-draft/status',
      payload: {
        status: 'not-a-status'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when campaign does not exist', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async () => null);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-missing/status',
      payload: {
        status: 'review'
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('CAMPAIGN_NOT_FOUND');

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/campaign-draft/status',
      payload: {
        status: 'review'
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });
});
