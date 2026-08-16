import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('GET /tenants/:tenantId/campaigns/:campaignId/report', () => {
  const makeCampaignStore = () => ({
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '00000000-0000-0000-0000-000000000000') {
          return null;
        }
        return { id: query.where.id };
      })
    },
    user: {
      findFirst: vi.fn(async () => ({
        id: 'test-user-id'
      }))
    },
    campaign: {
      create: vi.fn(async () => ({
        id: 'campaign-created'
      })),
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '00000000-0000-0000-0000-000000000001') {
          return null;
        }
        if (query.where.id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
          return {
            id: query.where.id,
            tenantId: '33333333-3333-3333-3333-333333333333',
            name: 'Campaign other tenant'
          };
        }
        return {
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111',
          name: 'Pilot campaign'
        };
      })
    },
    debtorRecord: {
      count: vi.fn(async () => 10)
    },
    callAttempt: {
      count: vi.fn(async () => 6)
    },
    callResult: {
      create: vi.fn(async () => ({
        id: 'result-1'
      })),
      count: vi.fn(async () => 4)
    },
    complianceDecision: {
      count: vi.fn(async () => 1)
    },
    usageEvent: {
      create: vi.fn(async () => ({
        id: 'usage-event-1'
      })),
      count: vi.fn(async () => 2)
    }
  });

  it('returns campaign report from report service', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111112/report'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      totalRecords: 10,
      attemptedCalls: 6,
      completedCalls: 2,
      blockedCalls: 1,
      ptpCount: 4
    });
    expect(campaignStore.usageEvent.count).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '11111111-1111-1111-1111-111111111112',
        eventType: 'call_completed'
      }
    });
    expect(campaignStore.debtorRecord.count).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111', campaignId: '11111111-1111-1111-1111-111111111112' }
    });
    expect(campaignStore.callAttempt.count).toHaveBeenCalledWith({
      where: { tenantId: '11111111-1111-1111-1111-111111111111', campaignId: '11111111-1111-1111-1111-111111111112' }
    });
    expect(campaignStore.callResult.count).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        callAttempt: { campaignId: '11111111-1111-1111-1111-111111111112' },
        outcome: 'ptp_created'
      }
    });
    expect(campaignStore.complianceDecision.count).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '11111111-1111-1111-1111-111111111112',
        decision: 'block'
      }
    });

    await app.close();
  });

  it('returns 404 when tenant does not exist', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/00000000-0000-0000-0000-000000000000/campaigns/11111111-1111-1111-1111-111111111112/report'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'TENANT_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 404 when campaign belongs to another tenant', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/report'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CAMPAIGN_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 400 on invalid tenant UUID', async () => {
    const app = createApp({ campaignStore: makeCampaignStore() });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/not-a-uuid/campaigns/11111111-1111-1111-1111-111111111112/report'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });
});
