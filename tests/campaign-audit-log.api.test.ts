import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

type AuditLogRow = {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type CampaignStore = {
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  user: {
    findFirst: (query: { where: { isActive: boolean; status: string; tenantId: string } }) => Promise<{ id: string } | null>;
  };
  campaign: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string; tenantId: string } | null>;
  };
  auditLog: {
    findMany: (query: Record<string, unknown>) => Promise<AuditLogRow[]>;
  };
};

const makeCampaignStore = (overrides: Partial<CampaignStore> = {}): CampaignStore => ({
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
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === 'missing-campaign') {
        return null;
      }
      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111'
      };
    })
  },
  auditLog: {
    findMany: vi.fn(async () => [])
  },
  ...overrides
});

const injectWithRole = (
  app: Awaited<ReturnType<typeof createApp>>,
  request: Parameters<typeof app.inject>[0],
  role: string
) => {
  return app.inject({
    ...request,
    headers: {
      'x-user-role': role,
      ...(request.headers ?? {})
    }
  });
};

const injectWithOwnerRole = (app: Awaited<ReturnType<typeof createApp>>, request: Parameters<typeof app.inject>[0]) =>
  injectWithRole(app, request, 'owner');

const injectWithOperatorRole = (app: Awaited<ReturnType<typeof createApp>>, request: Parameters<typeof app.inject>[0]) =>
  injectWithRole(app, request, 'operator');

describe('GET /tenants/:tenantId/campaigns/:campaignId/audit-logs', () => {
  it('returns 401 when audit role is missing', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('returns 403 when role has no audit log access', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOperatorRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  it('returns campaign-scoped audit logs from API and sorts by createdAt descending', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'log-call-other',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-2',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: { campaignId: 'c-other' },
            createdAt: '2026-08-16T10:00:00.000Z'
          },
          {
            id: 'log-script',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'script_version.created',
            entityType: 'scriptVersion',
            entityId: 'script-1',
            metadata: { campaignId: 'campaign-1', version: 2 },
            createdAt: '2026-08-16T09:00:00.000Z'
          },
          {
            id: 'log-call-target',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.sandbox_started',
            entityType: 'callAttempt',
            entityId: 'call-1',
            metadata: { campaignId: 'campaign-1', outcome: 'ptp_created' },
            createdAt: '2026-08-16T11:00:00.000Z'
          },
          {
            id: 'log-campaign',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'campaign.created',
            entityType: 'campaign',
            entityId: 'campaign-1',
            metadata: { sourceRoute: '/campaigns' },
            createdAt: '2026-08-16T08:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(3);
    expect(body[0].id).toBe('log-call-target');
    expect(body[1].id).toBe('log-script');
    expect(body[2].id).toBe('log-campaign');

    expect(campaignStore.auditLog.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.auditLog.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      orderBy: { createdAt: 'desc' }
    });

    await app.close();
  });

  it('returns 400 when params are invalid', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/not-a-uuid/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('filters campaign audit logs by query action and entityType', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'log-call-target',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.sandbox_started',
            entityType: 'callAttempt',
            entityId: 'call-1',
            metadata: { campaignId: 'campaign-1', outcome: 'ptp_created' },
            createdAt: '2026-08-16T11:00:00.000Z'
          },
          {
            id: 'log-script',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'script_version.created',
            entityType: 'scriptVersion',
            entityId: 'script-1',
            metadata: { campaignId: 'campaign-1', version: 2 },
            createdAt: '2026-08-16T09:00:00.000Z'
          },
          {
            id: 'log-call-other',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-2',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: { campaignId: 'c-other' },
            createdAt: '2026-08-16T08:30:00.000Z'
          },
          {
            id: 'log-call-result',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-3',
            metadata: { campaignId: 'campaign-1', reason: 'manual' },
            createdAt: '2026-08-16T08:20:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs?action=call.sandbox_started'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0].id).toBe('log-call-target');

    const responseByEntity = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs?entityType=callResult'
    });

    expect(responseByEntity.statusCode).toBe(200);
    expect(responseByEntity.json()[0].id).toBe('log-call-result');
    expect(responseByEntity.json()[0].entityType).toBe('callResult');

    await app.close();
  });

  it('paginates campaign audit logs with limit and offset', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'log-3',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.sandbox_started',
            entityType: 'callAttempt',
            entityId: 'call-3',
            metadata: { campaignId: 'campaign-1' },
            createdAt: '2026-08-16T12:00:00.000Z'
          },
          {
            id: 'log-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: { campaignId: 'campaign-1' },
            createdAt: '2026-08-16T11:00:00.000Z'
          },
          {
            id: 'log-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'campaign.created',
            entityType: 'campaign',
            entityId: 'campaign-1',
            metadata: { sourceRoute: '/campaigns' },
            createdAt: '2026-08-16T10:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs?limit=1&offset=1'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    expect(response.json()[0].id).toBe('log-2');

    await app.close();
  });

  it('uses default pagination when campaign audit log limit and offset are omitted', async () => {
    const logs = Array.from({ length: 25 }, (_, index) => ({
      id: `log-${index + 1}`,
      tenantId: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      action: 'call.sandbox_started',
      entityType: 'callAttempt',
      entityId: `call-${index + 1}`,
      metadata: { campaignId: 'campaign-1' },
      createdAt: `2026-08-16T00:${String(24 - index).padStart(2, '0')}:00.000Z`
    }));

    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => logs)
      }
    });
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(20);
    expect(body[0].id).toBe('log-1');
    expect(body[19].id).toBe('log-20');

    await app.close();
  });

  it('returns 400 for invalid campaign audit limit and offset', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs?limit=0&offset=-1'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when campaign audit logs limit exceeds max', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs?limit=101'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when campaign audit logs offset exceeds max', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs?offset=1001'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when campaign does not belong to tenant', async () => {
    const app = createApp({ campaignStore: makeCampaignStore({
      campaign: {
        findUnique: vi.fn(async (query: { where: { id: string } }) => {
          if (query.where.id === 'missing-campaign') {
            return null;
          }
          return { id: query.where.id, tenantId: '22222222-2222-2222-2222-222222222222' };
        })
      }
    }) });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('CAMPAIGN_NOT_FOUND');

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/campaign-1/audit-logs'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });
});

describe('GET /tenants/:tenantId/audit-logs', () => {
  it('returns 401 when audit role is missing', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');

    await app.close();
  });

  it('returns 403 when role has no audit log access', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOperatorRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs'
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  it('returns tenant-scoped audit logs from API and sorts by createdAt descending', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'tenant-audit-3',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.sandbox_started',
            entityType: 'callAttempt',
            entityId: 'call-3',
            metadata: {
              campaignId: 'campaign-2',
              sourceRoute: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-2/debtors/aaaaa/calls/sandbox'
            },
            createdAt: '2026-08-16T10:30:00.000Z'
          },
          {
            id: 'tenant-audit-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'campaign.created',
            entityType: 'campaign',
            entityId: 'campaign-1',
            metadata: {
              sourceRoute: '/campaigns',
              campaignId: 'campaign-1'
            },
            createdAt: '2026-08-16T10:00:00.000Z'
          },
          {
            id: 'tenant-audit-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-2',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: {
              campaignId: 'campaign-1',
              outcome: 'rejected'
            },
            createdAt: '2026-08-16T11:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(3);
    expect(body[0].id).toBe('tenant-audit-2');
    expect(body[1].id).toBe('tenant-audit-3');
    expect(body[2].id).toBe('tenant-audit-1');

    expect(campaignStore.auditLog.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.auditLog.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      orderBy: { createdAt: 'desc' }
    });

    await app.close();
  });

  it('filters tenant audit logs by action and entityType', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'tenant-audit-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-1',
            metadata: {
              campaignId: 'campaign-1',
              outcome: 'rejected'
            },
            createdAt: '2026-08-16T11:00:00.000Z'
          },
          {
            id: 'tenant-audit-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-2',
            action: 'campaign.created',
            entityType: 'campaign',
            entityId: 'campaign-1',
            metadata: {
              sourceRoute: '/campaigns'
            },
            createdAt: '2026-08-16T10:00:00.000Z'
          },
          {
            id: 'tenant-audit-3',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-3',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: {
              campaignId: 'campaign-2'
            },
            createdAt: '2026-08-16T12:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs?action=call.qa_updated&entityType=callResult'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('tenant-audit-3');
    expect(body[1].id).toBe('tenant-audit-1');

    expect(campaignStore.auditLog.findMany).toHaveBeenCalledOnce();
    expect(campaignStore.auditLog.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      orderBy: { createdAt: 'desc' }
    });

    await app.close();
  });

  it('filters tenant audit logs by campaignId from metadata', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'tenant-audit-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'campaign.created',
            entityType: 'campaign',
            entityId: 'campaign-1',
            metadata: {
              sourceRoute: '/campaigns',
              campaignId: 'campaign-1'
            },
            createdAt: '2026-08-16T11:00:00.000Z'
          },
          {
            id: 'tenant-audit-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-2',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: {
              campaignId: 'campaign-2',
              outcome: 'rejected'
            },
            createdAt: '2026-08-16T10:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs?campaignId=campaign-1'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('tenant-audit-1');

    await app.close();
  });

  it('supports limit and offset for tenant audit logs', async () => {
    const campaignStore = makeCampaignStore({
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'tenant-audit-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-1',
            metadata: {
              campaignId: 'campaign-1'
            },
            createdAt: '2026-08-16T12:00:00.000Z'
          },
          {
            id: 'tenant-audit-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-2',
            metadata: {
              campaignId: 'campaign-1'
            },
            createdAt: '2026-08-16T11:00:00.000Z'
          },
          {
            id: 'tenant-audit-3',
            tenantId: '11111111-1111-1111-1111-111111111111',
            userId: 'user-1',
            action: 'call.qa_updated',
            entityType: 'callResult',
            entityId: 'call-3',
            metadata: {
              campaignId: 'campaign-2'
            },
            createdAt: '2026-08-16T10:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs?limit=2&offset=1'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('tenant-audit-2');
    expect(body[1].id).toBe('tenant-audit-3');

    await app.close();
  });

  it('returns 400 for invalid pagination params', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs?limit=0'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when tenant audit logs limit exceeds max', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/audit-logs?limit=101'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when tenant audit logs offset exceeds max', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-111111111111/audit-logs?offset=1001'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when tenantId is invalid', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/not-a-uuid/audit-logs'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/audit-logs'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('TENANT_NOT_FOUND');

    await app.close();
  });
});
