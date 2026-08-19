import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

const makeStore = () => {
  const memberships = [
    {
      id: 'membership-1',
      tenantId: TENANT_ID,
      userId: 'user-1',
      roleName: 'tenant_owner',
      createdAt: new Date('2026-08-19T08:00:00.000Z').toISOString(),
      user: {
        id: 'user-1',
        name: 'Анна',
        email: 'anna@example.com',
        status: 'active',
        isActive: true
      }
    }
  ];
  const audit: Array<Record<string, unknown>> = [];

  return {
    memberships,
    audit,
    tenant: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (
        where.id === TENANT_ID ? { id: TENANT_ID } : null
      ))
    },
    user: {
      findFirst: vi.fn(async () => ({ id: 'user-1' }))
    },
    tenantMembership: {
      findMany: vi.fn(async () => memberships),
      findFirst: vi.fn(async ({ where }: { where: { tenantId: string; userId: string } }) =>
        memberships.find((row) => row.tenantId === where.tenantId && row.userId === where.userId) ?? null
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: `membership-${memberships.length + 1}`,
          ...data
        };
        memberships.push(row as any);
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = memberships.find((item) => item.id === where.id)!;
        Object.assign(row, data);
        return row;
      })
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        audit.push(data);
        return data;
      })
    }
  };
};

describe('tenant users API', () => {
  it('lists tenant memberships for tenant_owner', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: `/tenants/${TENANT_ID}/users`,
      headers: {
        'x-user-role': 'tenant_owner'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        role: 'tenant_owner'
      })
    ]);

    await app.close();
  });

  it('updates role and writes audit event only for tenant_owner', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const forbidden = await app.inject({
      method: 'PATCH',
      url: `/tenants/${TENANT_ID}/users/user-1/role`,
      headers: {
        'x-user-role': 'campaign_manager'
      },
      payload: {
        role: 'tenant_viewer'
      }
    });
    expect(forbidden.statusCode).toBe(403);

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${TENANT_ID}/users/user-1/role`,
      headers: {
        'x-user-role': 'tenant_owner'
      },
      payload: {
        role: 'tenant_viewer'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      userId: 'user-1',
      role: 'tenant_viewer'
    });
    expect(store.audit[0]?.action).toBe('tenant_user.role_updated');

    await app.close();
  });
});
