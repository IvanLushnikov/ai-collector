import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

const makeStore = () => {
  const grants: Array<Record<string, unknown>> = [];
  const audit: Array<Record<string, unknown>> = [];

  return {
    grants,
    audit,
    tenant: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (
        where.id === TENANT_ID ? { id: TENANT_ID } : null
      ))
    },
    supportAccessGrant: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `grant-${grants.length + 1}`, revokedAt: null, ...data };
        grants.push(row);
        return row;
      }),
      findFirst: vi.fn(async ({ where }: { where: { id: string } }) =>
        grants.find((row) => row.id === where.id) ?? null
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = grants.find((item) => item.id === where.id)!;
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

describe('support access path', () => {
  it('allows platform_admin to create and revoke support access grant', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const create = await app.inject({
      method: 'POST',
      url: '/support/access-grants',
      headers: {
        'x-user-role': 'platform_admin'
      },
      payload: {
        tenantId: TENANT_ID,
        userId: 'support-user-1',
        reason: 'Диагностика инцидента',
        expiresAt: '2026-08-20T08:00:00.000Z'
      }
    });

    expect(create.statusCode).toBe(201);
    expect(create.json()).toMatchObject({
      id: 'grant-1',
      tenantId: TENANT_ID,
      userId: 'support-user-1'
    });

    const revoke = await app.inject({
      method: 'POST',
      url: '/support/access-grants/grant-1/revoke',
      headers: {
        'x-user-role': 'platform_admin'
      }
    });

    expect(revoke.statusCode).toBe(200);
    expect(store.audit.map((row) => row.action)).toEqual([
      'support_access.granted',
      'support_access.revoked'
    ]);

    await app.close();
  });

  it('rejects support_engineer without platform grant-management role', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/support/access-grants',
      headers: {
        'x-user-role': 'support_engineer'
      },
      payload: {
        tenantId: TENANT_ID,
        userId: 'support-user-1',
        reason: 'Диагностика инцидента',
        expiresAt: '2026-08-20T08:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });
});
