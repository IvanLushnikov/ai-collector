import { expect, it, describe, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

const makeCampaignStore = () => ({
  tenant: {
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === '00000000-0000-0000-0000-000000000000') {
        return null;
      }
      return { id: query.where.id, legalBasisStatus: 'confirmed' };
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
      telephonyConnectionId: (data.telephonyConnectionId as string | null | undefined) ?? null,
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
    update: vi.fn(async ({ data, where }: { data: { status?: string; telephonyConnectionId?: string | null }; where: { id: string } }) => ({
      id: where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: `Campaign ${where.id}`,
      status: data.status ?? 'ready',
      timezone: 'UTC',
      telephonyConnectionId: data.telephonyConnectionId ?? null,
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }))
  },
  auditLog: {
    create: vi.fn(async () => ({
      id: 'audit-1'
    }))
  },
  scriptVersion: {
    findMany: vi.fn(async () => [
      {
        id: 'script-1',
        status: 'active',
        updatedAt: new Date('2026-08-16T08:00:00.000Z').toISOString()
      }
    ])
  },
  telephonyConnection: {
    findMany: vi.fn(async () => [
      {
        id: 'telephony-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        mode: 'production',
        status: 'active',
        updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
      }
    ]),
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === '22222222-2222-2222-2222-222222222221') {
        return {
          id: query.where.id,
          tenantId: '22222222-2222-2222-2222-222222222222',
          mode: 'production',
          status: 'active',
          updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
        };
      }
      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        mode: 'production',
        status: 'active',
        updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
      };
    })
  },
  debtorRecord: {
    count: vi.fn(async () => 2)
  },
  callAttempt: {
    count: vi.fn(async () => 5)
  },
  complianceDecision: {
    count: vi.fn(async () => 1),
    findMany: vi.fn(async () => [
      {
        id: 'decision-1',
        reasonCode: 'DEBT_STATUS_BLOCK',
        reasonText: 'Debt status blocks call',
        checkedAt: new Date('2026-08-16T06:00:00.000Z').toISOString()
      }
    ])
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

  it('binds a tenant telephony connection on create', async () => {
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
        timezone: 'Europe/Moscow',
        telephonyConnectionId: '33333333-3333-3333-3333-333333333333'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().telephonyConnectionId).toBe('33333333-3333-3333-3333-333333333333');
    expect(campaignStore.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        telephonyConnectionId: '33333333-3333-3333-3333-333333333333'
      })
    });

    await app.close();
  });

  it('rejects a telephony connection from another tenant', async () => {
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
        timezone: 'Europe/Moscow',
        telephonyConnectionId: '22222222-2222-2222-2222-222222222221'
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'TELEPHONY_CONNECTION_NOT_FOUND'
    });
    expect(campaignStore.campaign.create).not.toHaveBeenCalled();

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
  const authorizedRole = 'owner';

  it('rejects missing user role header', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns',
      headers: {
        'X-User-Role': 'auditor'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

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
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      }
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
      skip: 0,
      take: 20,
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

  it('supports pagination with limit and offset on campaigns list', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findMany = vi.fn(async () => [
      {
        id: 'campaign-offset',
        name: 'Offset campaign',
        status: 'draft',
        timezone: 'UTC',
        createdAt: '2026-08-12T10:00:00.000Z'
      }
    ]);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns?limit=1&offset=1',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual([
      {
        id: 'campaign-offset',
        name: 'Offset campaign',
        status: 'draft',
        timezone: 'UTC',
        createdAt: '2026-08-12T10:00:00.000Z'
      }
    ]);
    expect(campaignStore.campaign.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      skip: 1,
      take: 1,
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
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      }
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
      skip: 0,
      take: 20,
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
      url: '/tenants/not-a-uuid/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      }
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
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });

  it('rejects invalid pagination params for campaigns list', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const invalidLimitResponse = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns?limit=0',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(invalidLimitResponse.statusCode).toBe(400);
    expect(invalidLimitResponse.json().error).toBe('VALIDATION_ERROR');

    const invalidOffsetResponse = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns?offset=1001',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(invalidOffsetResponse.statusCode).toBe(400);
    expect(invalidOffsetResponse.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });
});

describe('GET /tenants/:tenantId/campaigns/:campaignId', () => {
  const authorizedRole = 'owner';

  it('rejects missing user role header', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-abc'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-abc',
      headers: {
        'X-User-Role': 'auditor'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

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
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-abc',
      headers: {
        'X-User-Role': authorizedRole
      }
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
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-other',
      headers: {
        'X-User-Role': authorizedRole
      }
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
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-missing',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('CAMPAIGN_NOT_FOUND');

    await app.close();
  });
});

describe('PATCH /tenants/:tenantId/campaigns/:campaignId/status', () => {
  const authorizedRole = 'owner';

  it('rejects missing user role header', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-draft/status',
      payload: {
        status: 'review'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-draft/status',
      headers: {
        'X-User-Role': 'operator'
      },
      payload: {
        status: 'review'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

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
      headers: {
        'X-User-Role': authorizedRole
      },
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
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        action: 'campaign.status_updated',
        entityType: 'campaign',
        entityId: 'campaign-draft',
        metadata: {
          campaignId: 'campaign-draft',
          fromStatus: 'draft',
          toStatus: 'review'
        }
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
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        status: 'completed'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');
    expect(campaignStore.auditLog.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects auto_paused to running through status patch', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign paused',
      status: 'auto_paused',
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/status',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        status: 'running'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('INVALID_STATUS_TRANSITION');
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects auto_paused to review through status patch', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign paused',
      status: 'auto_paused',
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/status',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        status: 'review'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('INVALID_STATUS_TRANSITION');
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 400 for invalid status payload', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-draft/status',
      headers: {
        'X-User-Role': authorizedRole
      },
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
      headers: {
        'X-User-Role': authorizedRole
      },
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
      headers: {
        'X-User-Role': authorizedRole
      },
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

describe('POST /tenants/:tenantId/campaigns/:campaignId/safe-resume', () => {
  const checklist = {
    reasonAcknowledged: true,
    causeResolved: true,
    ownerApproved: true
  };

  it('resumes auto_paused campaign to review and writes campaign.safe_resumed', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Campaign paused',
      status: 'auto_paused',
      timezone: 'UTC',
      createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/safe-resume',
      headers: {
        'X-User-Role': 'owner'
      },
      payload: {
        targetStatus: 'review',
        checklist
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('review');
    expect(campaignStore.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'campaign-paused' },
        data: { status: 'review' }
      })
    );
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.safe_resumed',
        entityType: 'campaign',
        entityId: 'campaign-paused',
        metadata: expect.objectContaining({
          fromStatus: 'auto_paused',
          toStatus: 'review',
          checklist,
          forceCall: false
        })
      })
    });

    await app.close();
  });

  it('allows compliance_officer to safe-resume to ready', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'auto_paused'
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/safe-resume',
      headers: {
        'X-User-Role': 'compliance_officer'
      },
      payload: {
        targetStatus: 'ready',
        checklist
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ready');

    await app.close();
  });

  it('rejects incomplete checklist', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'auto_paused'
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/safe-resume',
      headers: {
        'X-User-Role': 'owner'
      },
      payload: {
        targetStatus: 'review',
        checklist: {
          reasonAcknowledged: true,
          causeResolved: false,
          ownerApproved: true
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('SAFE_RESUME_CHECKLIST_INCOMPLETE');
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects collection_manager for safe-resume', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/safe-resume',
      headers: {
        'X-User-Role': 'collection_manager'
      },
      payload: {
        targetStatus: 'review',
        checklist
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  it('rejects targetStatus running', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'auto_paused'
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-paused/safe-resume',
      headers: {
        'X-User-Role': 'owner'
      },
      payload: {
        targetStatus: 'running',
        checklist
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });
});

describe('PATCH /tenants/:tenantId/campaigns/:campaignId/telephony-connection', () => {
  const authorizedRole = 'owner';

  it('binds a tenant telephony connection on a draft campaign', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'draft',
      telephonyConnectionId: null
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/telephony-connection',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        telephonyConnectionId: '33333333-3333-3333-3333-333333333333'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().telephonyConnectionId).toBe('33333333-3333-3333-3333-333333333333');
    expect(campaignStore.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'campaign-1' },
        data: { telephonyConnectionId: '33333333-3333-3333-3333-333333333333' }
      })
    );

    await app.close();
  });

  it('rejects binding another tenant connection', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'draft',
      telephonyConnectionId: null
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/telephony-connection',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        telephonyConnectionId: '22222222-2222-2222-2222-222222222221'
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'TELEPHONY_CONNECTION_NOT_FOUND'
    });
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects changing telephony connection while campaign is running', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'running',
      telephonyConnectionId: '33333333-3333-3333-3333-333333333333'
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/telephony-connection',
      headers: {
        'X-User-Role': authorizedRole
      },
      payload: {
        telephonyConnectionId: '44444444-4444-4444-4444-444444444444'
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: 'TELEPHONY_CONNECTION_LOCKED'
    });
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });
});

describe('GET /tenants/:tenantId/campaigns/:campaignId/readiness-summary', () => {
  const authorizedRole = 'owner';

  it('returns readiness summary in ready state when all checks pass', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'ready',
      telephonyConnectionId: 'telephony-1',
      updatedAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.debtorRecord.count = vi.fn(async () => 5);
    campaignStore.scriptVersion.findMany = vi.fn(async () => [
      {
        id: 'script-1',
        status: 'active',
        updatedAt: new Date('2026-08-16T08:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.telephonyConnection.findMany = vi.fn(async () => [
      {
        id: 'telephony-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        mode: 'production',
        status: 'active',
        updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.complianceDecision.count = vi.fn(async () => 0);
    campaignStore.complianceDecision.findMany = vi.fn(async () => []);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-ready/readiness-summary',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      campaignId: 'campaign-ready',
      campaignStatus: 'ready',
      source: 'campaign-readiness-v1',
      timestamp: expect.any(String),
      readinessHash: expect.any(String),
      readinessState: 'ready',
      blocked: false,
      stale: false,
      reasons: [],
      complianceReasons: []
    });

    expect(campaignStore.scriptVersion.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.telephonyConnection.findUnique).toHaveBeenCalledWith({
      where: { id: 'telephony-1' }
    });
    expect(campaignStore.complianceDecision.count).toHaveBeenCalledOnce();
    expect(campaignStore.complianceDecision.findMany).toHaveBeenCalledOnce();

    await app.close();
  });

  it('blocks production telephony when tenant legal basis is pending', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.tenant.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      legalBasisStatus: 'pending'
    }));
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'ready',
      telephonyConnectionId: 'telephony-1',
      updatedAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.debtorRecord.count = vi.fn(async () => 5);
    campaignStore.scriptVersion.findMany = vi.fn(async () => [
      {
        id: 'script-1',
        status: 'active',
        updatedAt: new Date('2026-08-16T08:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.complianceDecision.count = vi.fn(async () => 0);
    campaignStore.complianceDecision.findMany = vi.fn(async () => []);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-ready/readiness-summary',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.readinessState).toBe('blocked');
    expect(body.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'legal',
          reasonCode: 'LEGAL_BASIS_NOT_CONFIRMED'
        })
      ])
    );

    await app.close();
  });

  it('does not add legal basis block when selected connection is sandbox', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.tenant.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      legalBasisStatus: 'pending'
    }));
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'ready',
      telephonyConnectionId: 'telephony-sandbox',
      updatedAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.debtorRecord.count = vi.fn(async () => 5);
    campaignStore.scriptVersion.findMany = vi.fn(async () => [
      {
        id: 'script-1',
        status: 'active',
        updatedAt: new Date('2026-08-16T08:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.telephonyConnection.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      mode: 'sandbox',
      status: 'active',
      updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
    }));
    campaignStore.complianceDecision.count = vi.fn(async () => 0);
    campaignStore.complianceDecision.findMany = vi.fn(async () => []);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-ready/readiness-summary',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.reasons).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          reasonCode: 'LEGAL_BASIS_NOT_CONFIRMED'
        })
      ])
    );
    expect(body.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reasonCode: 'PRODUCTION_TELEPHONY_MISSING'
        })
      ])
    );

    await app.close();
  });

  it('ignores other tenant production connections and uses the selected campaign connection', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'ready',
      telephonyConnectionId: 'telephony-selected',
      updatedAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.debtorRecord.count = vi.fn(async () => 5);
    campaignStore.scriptVersion.findMany = vi.fn(async () => [
      {
        id: 'script-1',
        status: 'active',
        updatedAt: new Date('2026-08-16T08:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.telephonyConnection.findMany = vi.fn(async () => [
      {
        id: 'telephony-other',
        tenantId: '11111111-1111-1111-1111-111111111111',
        mode: 'production',
        status: 'active',
        updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.telephonyConnection.findUnique = vi.fn(async () => ({
      id: 'telephony-selected',
      tenantId: '11111111-1111-1111-1111-111111111111',
      mode: 'sandbox',
      status: 'disabled',
      updatedAt: new Date('2026-08-16T07:00:00.000Z').toISOString()
    }));
    campaignStore.complianceDecision.count = vi.fn(async () => 0);
    campaignStore.complianceDecision.findMany = vi.fn(async () => []);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-ready/readiness-summary',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'telephony',
          reasonCode: 'PRODUCTION_TELEPHONY_MISSING'
        })
      ])
    );
    expect(campaignStore.telephonyConnection.findUnique).toHaveBeenCalledWith({
      where: { id: 'telephony-selected' }
    });

    await app.close();
  });

  it('returns stale readiness when campaign has no blockers but config changed after campaign update', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'ready',
      telephonyConnectionId: 'telephony-1',
      updatedAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.debtorRecord.count = vi.fn(async () => 5);
    campaignStore.scriptVersion.findMany = vi.fn(async () => [
      {
        id: 'script-1',
        status: 'active',
        updatedAt: new Date('2026-08-16T10:00:00.000Z').toISOString()
      }
    ]);
    campaignStore.telephonyConnection.findMany = vi.fn(async () => [
      {
        id: 'telephony-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        mode: 'production',
        status: 'active',
        updatedAt: new Date('2026-08-16T10:30:00.000Z').toISOString()
      }
    ]);
    campaignStore.complianceDecision.count = vi.fn(async () => 0);
    campaignStore.complianceDecision.findMany = vi.fn(async () => []);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-stale/readiness-summary',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      campaignId: 'campaign-stale',
      campaignStatus: 'ready',
      source: 'campaign-readiness-v1',
      timestamp: expect.any(String),
      readinessHash: expect.any(String),
      readinessState: 'stale',
      blocked: false,
      stale: true,
      reasons: [],
      complianceReasons: []
    });

    await app.close();
  });

  it('returns blocked readiness when required checks are missing', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => ({
      id: query.where.id,
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'draft',
      updatedAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
    }));
    campaignStore.debtorRecord.count = vi.fn(async () => 0);
    campaignStore.scriptVersion.findMany = vi.fn(async () => []);
    campaignStore.telephonyConnection.findMany = vi.fn(async () => []);
    campaignStore.complianceDecision.count = vi.fn(async () => 1);
    campaignStore.complianceDecision.findMany = vi.fn(async () => [
      {
        id: 'decision-1',
        reasonCode: 'DEBT_STATUS_BLOCK',
        reasonText: 'Debt status blocks call',
        checkedAt: new Date('2026-08-16T06:00:00.000Z').toISOString()
      }
    ]);

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-blocked/readiness-summary',
      headers: {
        'X-User-Role': authorizedRole
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.blocked).toBe(true);
    expect(body.readinessState).toBe('blocked');
    expect(body.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'debtors',
          reasonCode: 'DEBTORS_MISSING'
        }),
        expect.objectContaining({
          source: 'script',
          reasonCode: 'SCRIPT_NOT_READY'
        }),
        expect.objectContaining({
          source: 'telephony',
          reasonCode: 'PRODUCTION_TELEPHONY_MISSING'
        }),
        expect.objectContaining({
          source: 'compliance',
          reasonCode: 'COMPLIANCE_BLOCKS_DETECTED'
        }),
        expect.objectContaining({
          source: 'campaign',
          reasonCode: 'CAMPAIGN_STATUS_INVALID'
        })
      ])
    );
    expect(body.complianceReasons).toEqual([
      {
        id: 'decision-1',
        reasonCode: 'DEBT_STATUS_BLOCK',
        reasonText: 'Debt status blocks call',
        checkedAt: new Date('2026-08-16T06:00:00.000Z').toISOString()
      }
    ]);

    await app.close();
  });

  it('rejects missing user role header', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-ready/readiness-summary'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role for readiness summary', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-ready/readiness-summary',
      headers: {
        'X-User-Role': 'auditor'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});

describe('GET /tenants/:tenantId/campaigns/:campaignId/review-items', () => {
  it('returns review items for flagged QA and blocked compliance decisions with tenant isolation', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === 'campaign-other-tenant') {
        return {
          id: query.where.id,
          tenantId: '22222222-2222-2222-2222-222222222222'
        };
      }

      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: `Campaign ${query.where.id}`,
        status: 'ready',
        timezone: 'UTC',
        createdAt: new Date().toISOString()
      };
    });
    campaignStore.callAttempt.findMany = vi.fn(async ({ where }) => {
      expect(where).toMatchObject({
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review',
        callResult: {
          qaStatus: 'flagged'
        }
      });

      return [
        {
          id: 'attempt-1',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: 'campaign-review',
          debtorRecordId: 'debtor-1',
          createdAt: new Date('2026-08-16T10:30:00.000Z').toISOString(),
          callResult: {
            id: 'result-1',
            outcome: 'error',
            qaStatus: 'flagged',
            createdAt: new Date('2026-08-16T10:20:00.000Z').toISOString(),
            reason: 'Need manual check'
          },
          debtorRecord: {
            id: 'debtor-1'
          }
        },
        {
          id: 'attempt-2',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: 'campaign-review',
          debtorRecordId: 'debtor-2',
          createdAt: new Date('2026-08-16T09:30:00.000Z').toISOString(),
          callResult: {
            id: 'result-2',
            outcome: 'callback_requested',
            qaStatus: 'flagged',
            createdAt: new Date('2026-08-16T09:25:00.000Z').toISOString(),
            reason: 'Need manual check'
          },
          debtorRecord: {
            id: 'debtor-2'
          }
        }
      ];
    });
    campaignStore.complianceDecision.findMany = vi.fn(async ({ where }) => {
      expect(where).toMatchObject({
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review',
        decision: 'block'
      });

      return [
        {
          id: 'decision-1',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: 'campaign-review',
          debtorRecordId: 'debtor-4',
          decision: 'block',
          reasonCode: 'CONSENT_REVOKED',
          reasonText: 'Consent status was revoked after onboarding',
          checkedAt: new Date('2026-08-16T10:10:00.000Z').toISOString()
        }
      ];
    });
    campaignStore.callAttempt.count = vi
      .fn(async ({ where }) => {
        if (where.debtorRecordId === 'debtor-1') {
          return 2;
        }
        if (where.debtorRecordId === 'debtor-2') {
          return 1;
        }
        if (where.debtorRecordId === 'debtor-4') {
          return 1;
        }
        return 0;
      });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items',
      headers: {
        'X-User-Role': 'qa_analyst'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(3);
    expect(body).toEqual([
      expect.objectContaining({
        itemType: 'qa',
        itemId: 'qa-result-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review',
        debtorRecordId: 'debtor-1',
        callAttemptId: 'attempt-1',
        callResultId: 'result-1',
        urgency: 'high',
        retryCount: 2
      }),
      expect.objectContaining({
        itemType: 'compliance',
        itemId: 'compliance-decision-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review',
        debtorRecordId: 'debtor-4',
        decision: 'block',
        reasonCode: 'CONSENT_REVOKED',
        urgency: 'high',
        retryCount: 1
      }),
      expect.objectContaining({
        itemType: 'qa',
        itemId: 'qa-result-2',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review',
        debtorRecordId: 'debtor-2',
        retryCount: 1,
        urgency: 'medium'
      })
    ]);

    expect(campaignStore.callAttempt.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.complianceDecision.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.callAttempt.count).toHaveBeenCalledTimes(3);

    await app.close();
  });

  it('returns 404 for missing tenant or campaign', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/campaign-review/review-items',
      headers: {
        'X-User-Role': 'qa_analyst'
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });

  it('rejects missing role header', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role for review items', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items',
      headers: {
        'X-User-Role': 'operator'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});

describe('PATCH /tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve', () => {
  it('resolves qa review item with audit trail', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.callResult = {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        expect(where).toEqual({ id: 'result-approve-1' });
        return {
          id: 'result-approve-1',
          qaStatus: 'flagged',
          callAttempt: {
            id: 'attempt-approve-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: 'campaign-review',
            debtorRecordId: 'debtor-1'
          }
        };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { qaStatus: string } }) => ({
        id: where.id,
        qaStatus: data.qaStatus
      }))
    };

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items/qa-result-approve-1/resolve',
      headers: {
        'X-User-Role': 'collection_manager'
      },
      payload: {
        action: 'approve',
        notes: 'Manual QA verification passed'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      itemType: 'qa',
      itemId: 'qa-result-approve-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: 'campaign-review',
      debtorRecordId: 'debtor-1',
      qaStatus: 'approved',
      action: 'approve'
    });

    expect(campaignStore.callResult?.findUnique).toHaveBeenCalledOnce();
    expect(campaignStore.callResult?.update).toHaveBeenCalledWith({
      where: { id: 'result-approve-1' },
      data: { qaStatus: 'approved' }
    });
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        action: 'review_item.resolved',
        entityType: 'callResult',
        entityId: 'result-approve-1',
        metadata: expect.objectContaining({
          itemType: 'qa',
          itemId: 'qa-result-approve-1',
          previousQaStatus: 'flagged',
          qaStatus: 'approved',
          action: 'approve'
        })
      })
    });

    await app.close();
  });

  it('acknowledges compliance review item and records audit trail', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.campaign.findUnique = vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === 'campaign-other-tenant') {
        return {
          id: query.where.id,
          tenantId: '22222222-2222-2222-2222-222222222222'
        };
      }

      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Campaign review',
        status: 'ready',
        timezone: 'UTC',
        createdAt: new Date().toISOString()
      };
    });
    campaignStore.complianceDecision.findMany = vi.fn(async ({ where }) => {
      expect(where).toMatchObject({
        id: 'decision-approve-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review'
      });

      return [
        {
          id: 'decision-approve-1',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: 'campaign-review',
          debtorRecordId: 'debtor-2',
          decision: 'block',
          reasonCode: 'CONSENT_REVOKED',
          reasonText: 'Consent status was revoked'
        }
      ];
    });
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items/compliance-decision-approve-1/resolve',
      headers: {
        'X-User-Role': 'compliance_officer'
      },
      payload: {
        action: 'escalate',
        notes: 'Escalated to compliance'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      itemType: 'compliance',
      itemId: 'compliance-decision-approve-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: 'campaign-review',
      debtorRecordId: 'debtor-2',
      action: 'escalate',
      status: 'acknowledged'
    });

    expect(campaignStore.complianceDecision.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.callResult?.findUnique).toBeUndefined();
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        action: 'review_item.resolved',
        entityType: 'complianceDecision',
        entityId: 'decision-approve-1',
        metadata: expect.objectContaining({
          itemType: 'compliance',
          action: 'escalate',
          decision: 'block'
        })
      })
    });

    await app.close();
  });

  it('returns 400 for malformed review item id', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items/invalid-item-id/resolve',
      headers: {
        'X-User-Role': 'qa_analyst'
      },
      payload: {
        action: 'approve'
      }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('INVALID_REVIEW_ITEM_ID');

    await app.close();
  });

  it('returns 404 for compliance review item that is not blocked', async () => {
    const campaignStore = makeCampaignStore();
    campaignStore.complianceDecision.findMany = vi.fn(async ({ where }) => {
      expect(where).toMatchObject({
        id: 'decision-allow-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-review',
        decision: 'block'
      });

      return [];
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items/compliance-decision-allow-1/resolve',
      headers: {
        'X-User-Role': 'owner'
      },
      payload: {
        action: 'reject',
        notes: 'Item is already acknowledged in allow status'
      }
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.error).toBe('REVIEW_ITEM_NOT_FOUND');
    expect(campaignStore.callResult?.findUnique).toBeUndefined();
    expect(campaignStore.callResult?.update).toBeUndefined();
    expect(campaignStore.auditLog.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects missing role header when resolving', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items/qa-result-approve-1/resolve',
      payload: {
        action: 'approve'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('rejects forbidden role when resolving review item', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-review/review-items/qa-result-approve-1/resolve',
      headers: {
        'X-User-Role': 'operator'
      },
      payload: {
        action: 'approve'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});
