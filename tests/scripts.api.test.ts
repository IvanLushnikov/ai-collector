import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { serializeScriptContent } from '../src/domain/script-version/index.js';

const lockedDisclosureContent = {
  agentName: 'Anna',
  agentId: 'agent-1',
  creditorName: 'Example Bank'
};
const serializedLockedDisclosure = serializeScriptContent(lockedDisclosureContent);

type AppStore = {
  user: {
    findFirst: (query: {
      where: { tenantId: string; isActive: boolean; status: string };
    }) => Promise<{ id: string } | null>;
  };
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  campaign: {
    create: (query: { data: Record<string, unknown> }) => Promise<{ id: string; tenantId: string; status: string; createdByUserId?: string }>;
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string; tenantId: string; status?: string } | null>;
    update: (query: { where: { id: string }; data: Record<string, unknown> }) => Promise<{
      id: string;
      status: string;
    }>;
  };
  scriptVersion: {
    findFirst: (query: {
      where: { campaignId: string };
      orderBy: { version: 'asc' | 'desc' };
      select: { version: true };
    }) => Promise<{ version: number } | null>;
    create: (query: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findMany?: (query: {
      where: { tenantId: string; campaignId: string };
      orderBy: { version: 'asc' | 'desc' };
      select: { version: true; status: true; createdAt: true; createdByUserId: true };
    }) => Promise<
      Array<{
        version: number;
        status: string;
        createdAt: string;
        createdByUserId: string;
      }>
    >;
  };
  auditLog?: {
    create: (payload: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
};

describe('POST /tenants/:tenantId/campaigns/:campaignId/scripts', () => {
  const makeStore = (overrides: Partial<AppStore> = {}): AppStore => ({
    user: {
      findFirst: vi.fn(async () => ({ id: 'user-1' }))
    },
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '00000000-0000-0000-0000-000000000000') {
          return null;
        }
        return { id: query.where.id };
      })
    },
    campaign: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: data.campaignId ? (data.campaignId as string) : 'campaign-created',
        tenantId: data.tenantId as string,
        status: data.status as string,
        name: data.name as string
      })),
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === 'campaign-missing') {
          return null;
        }
        return {
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        };
      }),
      update: vi.fn(async (query: { where: { id: string }; data: Record<string, unknown> }) => ({
        id: query.where.id,
        status: query.data.status as string
      }))
    },
    scriptVersion: {
      findFirst: vi.fn(async () => null),
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'script-1',
        tenantId: data.tenantId as string,
        campaignId: data.campaignId as string,
        version: data.version as number,
        status: 'draft',
        content: data.content as string,
        createdByUserId: data.createdByUserId as string,
        createdAt: new Date().toISOString()
      }))
    },
    auditLog: {
      create: vi.fn(async () => ({
        id: 'audit-script'
      }))
    },
    ...overrides
  });

  it('rejects an unauthenticated script write', async () => {
    const app = createApp({ campaignStore: makeStore() });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      payload: { content: lockedDisclosureContent }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('USER_ROLE_MISSING');
    await app.close();
  });

  it('creates first script version and moves campaign to review', async () => {
    const appStore = makeStore();

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: lockedDisclosureContent
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      id: 'script-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: '22222222-2222-2222-2222-222222222222',
      version: 1,
      status: 'draft',
      content: serializedLockedDisclosure,
      createdByUserId: 'user-1'
    });

    expect(appStore.scriptVersion.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        version: 1,
        content: serializedLockedDisclosure,
        createdByUserId: 'user-1'
      }
    });
    expect(appStore.campaign.update).toHaveBeenCalledWith({
      where: { id: '22222222-2222-2222-2222-222222222222' },
      data: { status: 'review' }
    });
    expect(appStore.auditLog?.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        action: 'script_version.created',
        entityType: 'scriptVersion',
        entityId: 'script-1'
      })
    });

    await app.close();
  });

  it('returns VALIDATION_ERROR when locked disclosure fields are missing', async () => {
    const appStore = makeStore();

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: 'Hello script'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');
    expect(appStore.scriptVersion.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns script versions for campaign ordered by version', async () => {
    const appStore = makeStore({
      scriptVersion: {
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => [
          {
            version: 1,
            status: 'draft',
            createdAt: '2026-08-16T09:00:00.000Z',
            createdByUserId: 'user-1'
          },
          {
            version: 2,
            status: 'active',
            createdAt: '2026-08-16T09:10:00.000Z',
            createdByUserId: 'user-2'
          }
        ]),
        create: vi.fn(async () => ({
          id: 'unused',
          tenantId: 'unused',
          campaignId: 'unused',
          version: 99,
          status: 'draft',
          content: 'unused',
          createdByUserId: 'unused',
          createdAt: '2026-08-16T09:00:00.000Z'
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        version: 1,
        status: 'draft',
        createdAt: '2026-08-16T09:00:00.000Z',
        createdByUserId: 'user-1'
      },
      {
        version: 2,
        status: 'active',
        createdAt: '2026-08-16T09:10:00.000Z',
        createdByUserId: 'user-2'
      }
    ]);

    expect(appStore.scriptVersion.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222'
      },
      orderBy: {
        version: 'asc'
      },
      select: {
        version: true,
        status: true,
        createdAt: true,
        createdByUserId: true
      }
    });

    await app.close();
  });

  it('returns 404 for list when campaign does not belong to tenant', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: data.campaignId ? (data.campaignId as string) : 'campaign-created',
          tenantId: data.tenantId as string,
          status: data.status as string,
          name: data.name as string
        })),
        findUnique: vi.fn(async () => ({
          id: '22222222-2222-2222-2222-222222222222',
          tenantId: '22222222-2222-2222-2222-222222222222'
        })),
        update: vi.fn(async () => ({
          id: '22222222-2222-2222-2222-222222222222',
          status: 'review'
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CAMPAIGN_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const appStore = makeStore({
      tenant: {
        findUnique: vi.fn(async () => null)
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'TENANT_NOT_FOUND'
    });

    await app.close();
  });

  it('returns empty list when script versions not found', async () => {
    const appStore = makeStore({
      scriptVersion: {
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        create: vi.fn(async () => ({
          id: 'unused',
          tenantId: 'unused',
          campaignId: 'unused',
          version: 99,
          status: 'draft',
          content: 'unused',
          createdByUserId: 'unused',
          createdAt: '2026-08-16T09:00:00.000Z'
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);

    await app.close();
  });

  it('creates subsequent script version with incremented version number', async () => {
    const appStore = makeStore({
      scriptVersion: {
        findFirst: vi.fn(async () => ({ version: 3 })),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'script-2',
          tenantId: data.tenantId as string,
          campaignId: data.campaignId as string,
          version: data.version as number,
          status: 'draft',
          content: data.content as string,
          createdByUserId: data.createdByUserId as string,
          createdAt: new Date().toISOString()
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: lockedDisclosureContent
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().version).toBe(4);
    expect(appStore.scriptVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        version: 4
      })
    });

    await app.close();
  });

  it('returns 409 and does not create a script when campaign is running', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: data.campaignId ? (data.campaignId as string) : 'campaign-created',
          tenantId: data.tenantId as string,
          status: data.status as string,
          name: data.name as string
        })),
        findUnique: vi.fn(async (query: { where: { id: string } }) => ({
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111',
          status: 'running'
        })),
        update: vi.fn(async (query: { where: { id: string }; data: Record<string, unknown> }) => ({
          id: query.where.id,
          status: query.data.status as string
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: lockedDisclosureContent
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: 'SCRIPT_VERSION_LOCKED'
    });
    expect(appStore.scriptVersion.create).not.toHaveBeenCalled();
    expect(appStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });

  it('creates a script version when campaign is in review', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: data.campaignId ? (data.campaignId as string) : 'campaign-created',
          tenantId: data.tenantId as string,
          status: data.status as string,
          name: data.name as string
        })),
        findUnique: vi.fn(async (query: { where: { id: string } }) => ({
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111',
          status: 'review'
        })),
        update: vi.fn(async (query: { where: { id: string }; data: Record<string, unknown> }) => ({
          id: query.where.id,
          status: query.data.status as string
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: lockedDisclosureContent
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().status).toBe('draft');
    expect(appStore.scriptVersion.create).toHaveBeenCalledOnce();
    expect(appStore.campaign.update).toHaveBeenCalledWith({
      where: { id: '22222222-2222-2222-2222-222222222222' },
      data: { status: 'review' }
    });

    await app.close();
  });

  it('returns 400 on invalid content', async () => {
    const app = createApp({
      campaignStore: makeStore()
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: ''
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when campaign does not belong to tenant', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: data.campaignId ? (data.campaignId as string) : 'campaign-created',
          tenantId: data.tenantId as string,
          status: data.status as string,
          name: data.name as string
        })),
        findUnique: vi.fn(async () => ({
          id: '22222222-2222-2222-2222-222222222222',
          tenantId: '22222222-2222-2222-2222-222222222222'
        })),
        update: vi.fn(async () => ({
          id: '22222222-2222-2222-2222-222222222222',
          status: 'review'
        }))
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: lockedDisclosureContent
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CAMPAIGN_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const appStore = makeStore({
      tenant: {
        findUnique: vi.fn(async () => null)
      }
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/22222222-2222-2222-2222-222222222222/scripts',
      headers: { 'x-user-role': 'owner' },
      payload: {
        content: lockedDisclosureContent
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'TENANT_NOT_FOUND'
    });

    await app.close();
  });
});
