import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { SESSION_COOKIE_NAME } from '../../src/auth/session-token.js';

type Row = Record<string, unknown>;

const makeStore = () => {
  const tenants: Row[] = [];
  const roles: Row[] = [];
  const users: Row[] = [];
  const sessions: Row[] = [];
  const campaigns: Row[] = [];
  const tenantMemberships: Row[] = [];

  const matchUser = (where: Row, row: Row): boolean => {
    if (typeof where.id === 'string' && row.id !== where.id) return false;
    if (typeof where.email === 'string' && row.email !== where.email) return false;
    if (typeof where.tenantId === 'string' && row.tenantId !== where.tenantId) return false;
    if (where.isActive === true && row.isActive !== true) return false;
    if (typeof where.status === 'string' && row.status !== where.status) return false;
    return true;
  };

  return {
    tenant: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = { id: '11111111-1111-1111-1111-111111111111', name: data.name, ...data };
        tenants.push(row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return tenants.find((row) => row.id === where.id) ?? { id: where.id, legalBasisStatus: 'confirmed' };
      })
    },
    role: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = { id: 'role-owner', name: 'owner', ...data };
        roles.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: { tenantId: string; name: string } }) => {
        return roles.find((row) => row.tenantId === where.tenantId && row.name === where.name) ?? null;
      })
    },
    user: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = { id: 'user-1', status: 'active', isActive: true, ...data };
        users.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where, include }: { where: Row; include?: Row }) => {
        const found = users.find((row) => matchUser(where, row)) ?? null;
        if (!found) return null;
        if (!include) return found;
        return {
          ...found,
          role: roles.find((row) => row.id === found.roleId) ?? { name: 'owner' },
          tenant: tenants.find((row) => row.id === found.tenantId) ?? { id: found.tenantId, name: 'Org' }
        };
      })
    },
    tenantMembership: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const existingIndex = tenantMemberships.findIndex((row) => row.userId === data.userId && row.tenantId === data.tenantId);
        const row = { id: existingIndex >= 0 ? tenantMemberships[existingIndex].id : `membership-${tenantMemberships.length + 1}`, ...data };
        if (existingIndex >= 0) {
          tenantMemberships[existingIndex] = row;
        } else {
          tenantMemberships.push(row);
        }
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: Row }) => {
        return tenantMemberships.find((row) => {
          if (typeof where.userId === 'string' && row.userId !== where.userId) return false;
          if (typeof where.tenantId === 'string' && row.tenantId !== where.tenantId) return false;
          return true;
        }) ?? null;
      })
    },
    session: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = { id: `session-${sessions.length + 1}`, revokedAt: null, ...data };
        sessions.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: Row }) => {
        return sessions.find((row) => {
          if (where.tokenHash && row.tokenHash !== where.tokenHash) return false;
          if (where.revokedAt === null && row.revokedAt != null) return false;
          return true;
        }) ?? null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Row }) => {
        const row = sessions.find((item) => item.id === where.id);
        if (row) Object.assign(row, data);
        return row ?? null;
      })
    },
    campaign: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = {
          id: 'campaign-1',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data
        };
        campaigns.push(row);
        return row;
      })
    },
    auditLog: {
      create: vi.fn(async () => ({ id: 'audit-1' }))
    }
  };
};

const sessionCookie = (response: { headers: Record<string, unknown> }): string => {
  const raw = response.headers['set-cookie'];
  const value = Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
  const match = value.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ? `${SESSION_COOKIE_NAME}=${match[1]}` : '';
};

describe('authContextMiddleware', () => {
  it('sets tenantContext and userRole from a valid session cookie', async () => {
    const campaignStore = makeStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const registered = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });
    expect(registered.statusCode).toBe(201);
    const cookie = sessionCookie(registered);
    expect(cookie).toContain(SESSION_COOKIE_NAME);

    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie }
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({
      authenticated: true,
      role: 'tenant_owner',
      user: { email: 'anna@example.com' }
    });

    const create = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { cookie },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });

    expect(create.statusCode).toBe(201);
    expect(create.json().tenantId).toBe('11111111-1111-1111-1111-111111111111');
    expect(create.json().createdByUserId).toBe('user-1');

    await app.close();
  });

  it('rejects a cookie-authenticated mutation without a trusted Origin when CSRF protection is enabled', async () => {
    const campaignStore = makeStore();
    const app = createApp({ campaignStore, csrfProtection: true, csrfAllowedOrigins: ['https://cabinet.example.test'] });
    await app.ready();

    const registered = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna-csrf@example.com',
        password: 'strong-password'
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { cookie: sessionCookie(registered) },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('CSRF_ORIGIN_REQUIRED');
    await app.close();
  });

  it('keeps header-based RBAC when no session cookie is present', async () => {
    const campaignStore = makeStore();
    await campaignStore.user.create({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        roleId: 'role-owner',
        email: 'dev@example.com',
        name: 'Dev'
      }
    });
    const app = createApp({ campaignStore });
    await app.ready();

    const missing = await app.inject({
      method: 'POST',
      url: '/campaigns',
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });
    expect(missing.statusCode).toBe(401);
    expect(missing.json().error).toBe('USER_ROLE_MISSING');

    const withHeader = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { 'X-User-Role': 'owner' },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });
    expect(withHeader.statusCode).toBe(201);

    await app.close();
  });

  it('does not accept header identity when the application disables it', async () => {
    const campaignStore = makeStore();
    await campaignStore.user.create({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        roleId: 'role-owner',
        email: 'production@example.com',
        name: 'Production'
      }
    });
    const app = createApp({ campaignStore, allowHeaderIdentity: false });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { 'X-User-Role': 'owner', 'X-Tenant-Id': '11111111-1111-1111-1111-111111111111' },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('AUTHENTICATION_REQUIRED');
    await app.close();
  });

  it('rejects cross-tenant request when session tenant does not match route tenant', async () => {
    const campaignStore = makeStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const registered = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });
    const cookie = sessionCookie(registered);

    const create = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { cookie },
      payload: {
        tenantId: '22222222-2222-2222-2222-222222222222',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });

    expect(create.statusCode).toBe(403);
    expect(create.json().error).toBe('TENANT_SCOPE_MISMATCH');

    await app.close();
  });

  it('uses current membership role instead of stale session role snapshot', async () => {
    const campaignStore = makeStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const registered = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });
    const cookie = sessionCookie(registered);

    await campaignStore.tenantMembership.create({
      data: {
        userId: 'user-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        roleName: 'tenant_viewer'
      }
    });

    const create = await app.inject({
      method: 'POST',
      url: '/campaigns',
      headers: { cookie },
      payload: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Пилот',
        timezone: 'Europe/Moscow'
      }
    });

    expect(create.statusCode).toBe(403);
    expect(create.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});
