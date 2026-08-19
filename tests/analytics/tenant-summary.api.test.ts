import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

const tenantId = '11111111-1111-1111-1111-111111111111';

const injectOwner = (app: any, request: any) => app.inject({
  ...request,
  headers: { 'x-user-role': 'owner', ...(request.headers ?? {}) }
});

describe('GET /tenants/:tenantId/analytics/summary', () => {
  const makeStore = () => ({
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => (
        query.where.id === tenantId ? { id: tenantId, connectedMinuteRateRub: 2 } : null
      ))
    },
    user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
    campaign: {
      findUnique: vi.fn(async () => ({ id: 'c1', tenantId })),
      findMany: vi.fn(async () => [
        { id: 'c1', tenantId, name: 'A' },
        { id: 'c2', tenantId, name: 'B' }
      ])
    },
    debtorRecord: { count: vi.fn(async () => 3) },
    callAttempt: { count: vi.fn(async () => 2) },
    callResult: { count: vi.fn(async () => 1) },
    complianceDecision: { count: vi.fn(async () => 0) },
    usageEvent: {
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0)
    }
  });

  it('returns four KPI fields aggregated for the tenant', async () => {
    const app = createApp({ campaignStore: makeStore() });
    await app.ready();
    const response = await injectOwner(app, {
      method: 'GET',
      url: `/tenants/${tenantId}/analytics/summary`
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      tenantId,
      campaignCount: 2,
      attemptedCalls: expect.any(Number),
      completedCalls: expect.any(Number),
      ptpCount: expect.any(Number)
    });
    expect(body).toHaveProperty('costPerCall');
    await app.close();
  });

  it('keeps tenant isolation', async () => {
    const app = createApp({ campaignStore: makeStore() });
    await app.ready();
    const response = await injectOwner(app, {
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/analytics/summary'
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('TENANT_NOT_FOUND');
    await app.close();
  });
});
