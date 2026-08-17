import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

type AppStore = {
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  user: {
    findFirst: (query: {
      where: { tenantId: string; isActive: boolean; status: string };
    }) => Promise<{ id: string } | null>;
  };
  telephonyConnection: {
    create: (payload: {
      data: {
        tenantId: string;
        provider: string;
        mode: string;
        status: string;
        displayName: string;
      };
    }) => Promise<{
      id: string;
      tenantId: string;
      provider: string;
      mode: string;
      status: string;
      displayName: string;
      createdAt: string;
      updatedAt: string;
    }>;
    findUnique?: (query: { where: { id: string } }) => Promise<{
      id: string;
      tenantId: string;
      provider: string;
      mode: string;
      status: string;
      displayName: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    update?: (payload: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<{
      id: string;
      tenantId: string;
      provider: string;
      mode: string;
      status: string;
      displayName: string;
      createdAt: string;
      updatedAt: string;
    }>;
    findMany: (query: {
      where: { tenantId: string };
      orderBy?: { createdAt: 'asc' | 'desc' };
      select?: {
        id: boolean;
        provider: boolean;
        mode: boolean;
        status: boolean;
        displayName: boolean;
        createdAt: boolean;
        updatedAt: boolean;
      };
    }) => Promise<
      Array<{
        id: string;
        tenantId: string;
        provider: string;
        mode: string;
        status: string;
        displayName: string;
        createdAt: string;
        updatedAt: string;
      }>
    >;
  };
  campaign?: {
    findMany?: (query: {
      where: {
        tenantId: string;
        telephonyConnectionId: string;
        status: { in: string[] };
      };
    }) => Promise<Array<{ id: string; status: string }>>;
  };
  auditLog?: {
    create: (payload: {
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

describe('GET /tenants/:tenantId/telephony-connections', () => {
  const makeStore = (overrides: Partial<AppStore> = {}): AppStore => ({
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '11111111-1111-1111-1111-111111111111') {
          return { id: query.where.id };
        }

        return null;
      })
    },
    user: {
      findFirst: vi.fn(async () => ({
        id: 'operator-user-id'
      }))
    },
    telephonyConnection: {
      create: vi.fn(),
      findMany: vi.fn(async (query) => {
        if (query.where.tenantId === '11111111-1111-1111-1111-111111111111') {
          return [
            {
              id: 'telephony-1',
              tenantId: '11111111-1111-1111-1111-111111111111',
              provider: 'example',
              mode: 'sandbox',
              status: 'active',
              displayName: 'Sandbox dialer',
              createdAt: '2026-08-16T08:00:00.000Z',
              updatedAt: '2026-08-16T08:00:00.000Z'
            },
            {
              id: 'telephony-2',
              tenantId: '11111111-1111-1111-1111-111111111111',
              provider: 'example',
              mode: 'production',
              status: 'disabled',
              displayName: 'Prod dialer',
              createdAt: '2026-08-16T09:00:00.000Z',
              updatedAt: '2026-08-16T09:00:00.000Z'
            }
          ];
        }

        return [];
      })
    },
    ...overrides
  });

  it('returns tenant-scoped telephony connections sorted by createdAt', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections',
      headers: {
        'x-user-role': 'owner'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: 'telephony-1',
        provider: 'example',
        mode: 'sandbox',
        status: 'active',
        displayName: 'Sandbox dialer',
        createdAt: '2026-08-16T08:00:00.000Z',
        updatedAt: '2026-08-16T08:00:00.000Z'
      },
      {
        id: 'telephony-2',
        provider: 'example',
        mode: 'production',
        status: 'disabled',
        displayName: 'Prod dialer',
        createdAt: '2026-08-16T09:00:00.000Z',
        updatedAt: '2026-08-16T09:00:00.000Z'
      }
    ]);

    expect(appStore.telephonyConnection.findMany).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        provider: true,
        mode: true,
        status: true,
        displayName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/22222222-2222-2222-2222-222222222222/telephony-connections',
      headers: {
        'x-user-role': 'owner'
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'TENANT_NOT_FOUND' });
    expect(appStore.telephonyConnection.findMany).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 401 when role header is missing', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });

    await app.close();
  });

  it('returns 403 when role is not allowed for GET', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections',
      headers: {
        'x-user-role': 'operator'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});

describe('POST /tenants/:tenantId/telephony-connections', () => {
  const makeStore = (overrides: Partial<AppStore> = {}): AppStore => ({
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '11111111-1111-1111-1111-111111111111') {
          return { id: query.where.id };
        }

        return null;
      })
    },
    telephonyConnection: {
      create: vi.fn(async (payload) => ({
        id: 'telephony-created',
        tenantId: payload.data.tenantId,
        provider: payload.data.provider,
        mode: payload.data.mode,
        status: payload.data.status,
        displayName: payload.data.displayName,
        createdAt: '2026-08-16T10:00:00.000Z',
        updatedAt: '2026-08-16T10:00:00.000Z'
      })),
      findMany: vi.fn(async () => [])
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    },
    user: {
      findFirst: vi.fn(async () => ({
        id: 'operator-user-id'
      }))
    },
    ...overrides
  });

  it('creates telephony connection for tenant', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        provider: 'example',
        mode: 'sandbox',
        displayName: 'Demo line'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: 'telephony-created',
      tenantId: '11111111-1111-1111-1111-111111111111',
      provider: 'example',
      mode: 'sandbox',
      status: 'active',
      displayName: 'Demo line',
      createdAt: '2026-08-16T10:00:00.000Z',
      updatedAt: '2026-08-16T10:00:00.000Z'
    });

    expect(appStore.telephonyConnection.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        provider: 'example',
        mode: 'sandbox',
        status: 'active',
        displayName: 'Demo line'
      }
    });

    expect(appStore.auditLog?.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'operator-user-id',
        action: 'telephony_connection.created',
        entityType: 'telephonyConnection',
        entityId: 'telephony-created',
        metadata: {
          provider: 'example',
          mode: 'sandbox',
          status: 'active',
          sourceRoute: '/tenants/:tenantId/telephony-connections',
          tenantId: '11111111-1111-1111-1111-111111111111'
        }
      }
    });

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/22222222-2222-2222-2222-222222222222/telephony-connections',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        provider: 'example',
        mode: 'sandbox',
        displayName: 'Demo line'
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'TENANT_NOT_FOUND' });

    await app.close();
  });

  it('returns 400 for invalid telephony payload', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        provider: '',
        mode: 'invalid',
        displayName: ''
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');
    expect(appStore.telephonyConnection.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 422 when tenant has no active user', async () => {
    const appStore = makeStore({
      user: {
        findFirst: vi.fn(async () => null)
      }
    });
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections',
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        provider: 'example',
        mode: 'sandbox',
        displayName: 'Demo line'
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
    expect(appStore.telephonyConnection.create).not.toHaveBeenCalled();
    expect(appStore.auditLog?.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns 403 when role is not allowed for POST', async () => {
    const appStore = makeStore({
      user: {
        findFirst: vi.fn(async () => ({ id: 'operator-user-id' }))
      }
    });
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/telephony-connections',
      headers: {
        'x-user-role': 'operator'
      },
      payload: {
        provider: 'example',
        mode: 'sandbox',
        displayName: 'Demo line'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});

describe('PATCH /tenants/:tenantId/telephony-connections/:connectionId', () => {
  const connectionId = '33333333-3333-3333-3333-333333333333';

  const makeStore = (overrides: Partial<AppStore> = {}): AppStore => ({
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '11111111-1111-1111-1111-111111111111') {
          return { id: query.where.id };
        }

        return null;
      })
    },
    user: {
      findFirst: vi.fn(async () => ({
        id: 'operator-user-id'
      }))
    },
    telephonyConnection: {
      create: vi.fn(),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id !== connectionId) {
          return null;
        }

        return {
          id: connectionId,
          tenantId: '11111111-1111-1111-1111-111111111111',
          provider: 'sandbox',
          mode: 'sandbox',
          status: 'active',
          displayName: 'Sandbox dialer',
          createdAt: '2026-08-16T10:00:00.000Z',
          updatedAt: '2026-08-16T10:00:00.000Z'
        };
      }),
      update: vi.fn(async (payload) => ({
        id: payload.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        provider: String(payload.data.provider ?? 'sandbox'),
        mode: 'sandbox',
        status: 'active',
        displayName: String(payload.data.displayName ?? 'Sandbox dialer'),
        createdAt: '2026-08-16T10:00:00.000Z',
        updatedAt: '2026-08-16T11:00:00.000Z'
      }))
    },
    campaign: {
      findMany: vi.fn(async () => [])
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    },
    ...overrides
  });

  it('rejects provider change when a running campaign uses the connection', async () => {
    const appStore = makeStore({
      campaign: {
        findMany: vi.fn(async () => [{ id: 'campaign-running', status: 'running' }])
      }
    });
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/11111111-1111-1111-1111-111111111111/telephony-connections/${connectionId}`,
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        provider: 'exolve'
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: 'TELEPHONY_PROVIDER_LOCKED' });
    expect(appStore.telephonyConnection.update).not.toHaveBeenCalled();
    expect(appStore.auditLog?.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects provider change when an auto_paused campaign uses the connection', async () => {
    const appStore = makeStore({
      campaign: {
        findMany: vi.fn(async () => [{ id: 'campaign-paused', status: 'auto_paused' }])
      }
    });
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/11111111-1111-1111-1111-111111111111/telephony-connections/${connectionId}`,
      headers: {
        'x-user-role': 'integration_admin'
      },
      payload: {
        provider: 'exolve'
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ error: 'TELEPHONY_PROVIDER_LOCKED' });
    expect(appStore.telephonyConnection.update).not.toHaveBeenCalled();
    expect(appStore.auditLog?.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('updates provider when no running campaign uses the connection', async () => {
    const appStore = makeStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/11111111-1111-1111-1111-111111111111/telephony-connections/${connectionId}`,
      headers: {
        'x-user-role': 'owner'
      },
      payload: {
        provider: 'exolve'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().provider).toBe('exolve');
    expect(appStore.telephonyConnection.update).toHaveBeenCalledWith({
      where: { id: connectionId },
      data: { provider: 'exolve' }
    });
    expect(appStore.auditLog?.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'telephony_connection.updated',
        entityId: connectionId,
        metadata: expect.objectContaining({
          provider: 'exolve'
        })
      })
    });

    await app.close();
  });
});
