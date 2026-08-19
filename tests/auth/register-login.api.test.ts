import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { verifyPassword } from '../../src/auth/password.js';
import { SESSION_COOKIE_NAME } from '../../src/auth/session-token.js';

type Row = Record<string, unknown>;

const makeAuthStore = () => {
  const tenants: Row[] = [];
  const roles: Row[] = [];
  const users: Row[] = [];
  const sessions: Row[] = [];

  return {
    tenant: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = {
          id: `tenant-${tenants.length + 1}`,
          status: 'active',
          legalBasisStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data
        };
        tenants.push(row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return tenants.find((row) => row.id === where.id) ?? null;
      })
    },
    role: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = {
          id: `role-${roles.length + 1}`,
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data
        };
        roles.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: { tenantId: string; name: string } }) => {
        return roles.find((row) => row.tenantId === where.tenantId && row.name === where.name) ?? null;
      })
    },
    user: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = {
          id: `user-${users.length + 1}`,
          status: 'active',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data
        };
        users.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where, include }: { where: Row; include?: Row }) => {
        const email = typeof where.email === 'string' ? where.email : undefined;
        const found = users.find((row) => {
          if (email && row.email !== email) {
            return false;
          }
          return true;
        }) ?? null;
        if (!found) {
          return null;
        }
        if (!include) {
          return found;
        }
        const role = roles.find((row) => row.id === found.roleId) ?? null;
        const tenant = tenants.find((row) => row.id === found.tenantId) ?? null;
        return { ...found, role, tenant };
      })
    },
    session: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = {
          id: `session-${sessions.length + 1}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          revokedAt: null,
          ...data
        };
        sessions.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: Row }) => {
        return sessions.find((row) => {
          if (where.tokenHash && row.tokenHash !== where.tokenHash) {
            return false;
          }
          if (where.revokedAt === null && row.revokedAt != null) {
            return false;
          }
          return true;
        }) ?? null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Row }) => {
        const row = sessions.find((item) => item.id === where.id);
        if (!row) {
          return null;
        }
        Object.assign(row, data);
        return row;
      })
    },
    campaign: {
      create: vi.fn()
    },
    _state: { tenants, roles, users, sessions }
  };
};

const cookieFromResponse = (response: { headers: Record<string, unknown> }): string => {
  const raw = response.headers['set-cookie'];
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw)) {
    return String(raw[0] ?? '');
  }
  return '';
};

describe('POST /auth/register', () => {
  it('creates tenant, owner user and session cookie', async () => {
    const campaignStore = makeAuthStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.user).toMatchObject({
      name: 'Анна Котова',
      email: 'anna@example.com'
    });
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.tenant).toMatchObject({ name: 'ООО МКК ФинЛиния' });
    expect(body.role).toBe('tenant_owner');
    expect(cookieFromResponse(response)).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(campaignStore.user.create).toHaveBeenCalledOnce();
    const created = campaignStore._state.users[0];
    expect(created.passwordHash).toBeTruthy();
    await expect(verifyPassword(String(created.passwordHash), 'strong-password')).resolves.toBe(true);

    await app.close();
  });

  it('rejects a second registration with the same email', async () => {
    const campaignStore = makeAuthStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const first = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'Организация 1',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'Организация 2',
        name: 'Другой пользователь',
        email: 'anna@example.com',
        password: 'another-password'
      }
    });

    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe('EMAIL_ALREADY_EXISTS');
    expect(campaignStore.user.create).toHaveBeenCalledOnce();

    await app.close();
  });
});

describe('POST /auth/login', () => {
  it('logs in with email and password and sets a session cookie', async () => {
    const campaignStore = makeAuthStore();
    const app = createApp({ campaignStore });
    await app.ready();

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      role: 'tenant_owner',
      user: { email: 'anna@example.com', name: 'Анна Котова' }
    });
    expect(cookieFromResponse(response)).toContain(`${SESSION_COOKIE_NAME}=`);

    await app.close();
  });

  it('rejects an invalid password', async () => {
    const campaignStore = makeAuthStore();
    const app = createApp({ campaignStore });
    await app.ready();

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        organizationName: 'ООО МКК ФинЛиния',
        name: 'Анна Котова',
        email: 'anna@example.com',
        password: 'strong-password'
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'anna@example.com',
        password: 'wrong-password'
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toBe('INVALID_CREDENTIALS');

    await app.close();
  });
});
