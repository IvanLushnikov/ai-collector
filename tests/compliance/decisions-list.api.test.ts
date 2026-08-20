import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

type AppStore = {
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  campaign: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string; tenantId: string } | null>;
  };
  complianceDecision?: {
    findMany: (query: {
      where: { tenantId: string; campaignId: string; decision?: string };
      skip: number;
      take: number;
      orderBy: { checkedAt: 'asc' | 'desc' };
      select: {
        id: true;
        tenantId: true;
        campaignId: true;
        debtorRecordId: true;
        decision: true;
        reasonCode: true;
        reasonText: true;
        ruleVersion: true;
        checkedAt: true;
      };
    }) => Promise<
      Array<{
        id: string;
        tenantId: string;
        campaignId: string;
        debtorRecordId: string;
        decision: string;
        reasonCode: string;
        reasonText: string;
        ruleVersion: string;
        checkedAt: string;
      }>
    >;
  };
};

const makeCampaignStore = (overrides: Partial<AppStore> = {}): AppStore => ({
  tenant: {
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === '00000000-0000-0000-0000-000000000000') {
        return null;
      }
      return { id: query.where.id };
    })
  },
  campaign: {
    findUnique: vi.fn(async (query: { where: { id: string } }) => {
      if (query.where.id === '33333333-3333-3333-3333-333333333333') {
        return {
          id: query.where.id,
          tenantId: '22222222-2222-2222-2222-222222222222'
        };
      }
      return {
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111'
      };
    })
  },
  complianceDecision: {
    findMany: vi.fn(async () => [])
  },
  ...overrides
});

describe('GET /tenants/:tenantId/campaigns/:campaignId/compliance-decisions', () => {
  it('returns paginated campaign compliance decisions with default limit and offset', async () => {
    const appStore = makeCampaignStore({
      complianceDecision: {
        findMany: vi.fn(async ({ skip, take }) => {
          const records = Array.from({ length: 25 }, (_, index) => ({
            id: `decision-${index + 1}`,
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '55555555-5555-5555-5555-555555555555',
            debtorRecordId: `debtor-${index + 1}`,
            decision: index % 2 === 0 ? 'allow' : 'block',
            reasonCode: `CODE_${index + 1}`,
            reasonText: `Reason ${index + 1}`,
            ruleVersion: 'v1',
            checkedAt: `2026-08-16T00:${String(index).padStart(2, '0')}:00.000Z`
          }));
          return records.slice(skip, skip + take);
        })
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions',
      headers: { 'x-user-role': 'operator' }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(20);
    expect(body[0]).toEqual({
      id: 'decision-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: '55555555-5555-5555-5555-555555555555',
      debtorRecordId: 'debtor-1',
      decision: 'allow',
      reasonCode: 'CODE_1',
      reasonText: 'Reason 1',
      checkedAt: '2026-08-16T00:00:00.000Z',
      blockKind: null,
      ruleVersion: 'v1'
    });

    expect(appStore.complianceDecision?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '55555555-5555-5555-5555-555555555555'
      },
      skip: 0,
      take: 20,
      orderBy: {
        checkedAt: 'asc'
      },
      select: {
        id: true,
        tenantId: true,
        campaignId: true,
        debtorRecordId: true,
        decision: true,
        reasonCode: true,
        reasonText: true,
        ruleVersion: true,
        checkedAt: true
      }
    });

    await app.close();
  });

  it('filters compliance decisions by decision value', async () => {
    const appStore = makeCampaignStore({
      complianceDecision: {
        findMany: vi.fn(async ({ where }) => [
          {
            id: 'decision-block-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '55555555-5555-5555-5555-555555555555',
            debtorRecordId: 'debtor-10',
            decision: where.decision ?? 'block',
            reasonCode: 'CONSENT_REVOKED',
            reasonText: 'Consent revoked',
            ruleVersion: 'v1',
            checkedAt: '2026-08-16T09:00:00.000Z'
          }
        ])
      }
    });

    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions?decision=block',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as Array<Record<string, unknown>>;
    expect(body).toHaveLength(1);
    expect(body[0].decision).toBe('block');
    expect(body[0].blockKind).toBeNull();

    expect(appStore.complianceDecision?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '55555555-5555-5555-5555-555555555555',
        decision: 'block'
      },
      skip: 0,
      take: 20,
      orderBy: {
        checkedAt: 'asc'
      },
      select: {
        id: true,
        tenantId: true,
        campaignId: true,
        debtorRecordId: true,
        decision: true,
        reasonCode: true,
        reasonText: true,
        ruleVersion: true,
        checkedAt: true
      }
    });

    await app.close();
  });

  it('returns 400 when limit validation fails', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions?limit=101',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 400 when decision filter is invalid', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions?decision=maybe',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions',
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'TENANT_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 404 when campaign does not belong to tenant', async () => {
    const appStore = makeCampaignStore();
    const app = createApp({ campaignStore: appStore as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/33333333-3333-3333-3333-333333333333/compliance-decisions',
      headers: { 'x-user-role': 'operator' }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CAMPAIGN_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 401 when X-User-Role is missing', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });

    await app.close();
  });

  it('returns 403 when user role is not allowed', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() as any });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/55555555-5555-5555-5555-555555555555/compliance-decisions',
      headers: { 'x-user-role': 'auditor' }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: 'FORBIDDEN',
      message: 'User role is not allowed for this endpoint'
    });

    await app.close();
  });
});
