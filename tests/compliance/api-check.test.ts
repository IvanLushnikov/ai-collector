import { expect, it, describe, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check', () => {
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
      findFirst: vi.fn(async () => ({ id: 'user-1' }))
    },
    campaign: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === 'campaign-missing') {
          return null;
        }
        return {
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        };
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'campaign-1',
        tenantId: data.tenantId as string,
        name: data.name as string,
        status: 'draft',
        timezone: data.timezone as string,
        createdByUserId: data.createdByUserId as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      findMany: vi.fn(async () => [])
    },
    debtorRecord: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
          return {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '11111111-1111-1111-1111-111111111111',
            phone: '+79501234567',
            timezone: 'Europe/Moscow',
            debtAmount: 1200,
            debtStatus: 'active',
            consentStatus: 'revoked'
          };
        }
        if (query.where.id === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
          return {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            tenantId: '22222222-2222-2222-2222-222222222222',
            campaignId: '11111111-1111-1111-1111-111111111111',
            phone: '+79995552211',
            timezone: 'UTC',
            debtAmount: 300,
            debtStatus: 'active',
            consentStatus: 'given'
          };
        }
        if (query.where.id === 'cccccccc-cccc-cccc-cccc-cccccccccccc') {
          return {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '11111111-1111-1111-1111-111111111111',
            phone: '+79501234567',
            timezone: 'Europe/Moscow',
            debtAmount: 800,
            debtStatus: 'active',
            consentStatus: 'pending'
          };
        }
        return null;
      }),
      count: vi.fn(async () => 0),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `debtor-${data.externalId ?? 'unknown'}`,
        ...data
      }))
    },
    callAttempt: {
      count: vi.fn(async () => 0)
    },
    complianceDecision: {
      create: vi.fn(async () => ({})),
      count: vi.fn(async () => 0)
    }
  });

  it('checks compliance, returns decision and reasons, and stores log', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111111/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/compliance/check',
      headers: { 'x-user-role': 'operator' }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual(
      expect.objectContaining({
        decision: 'block',
        reasons: expect.arrayContaining([
          expect.objectContaining({
            decision: 'block',
            reasonCode: 'CONSENT_REVOKED',
            reasonText: 'Consent status is revoked',
            blockKind: null
          })
        ]),
        rules: ['call-window', 'consent-status', 'debt-status', 'frequency-limit', 'suppression']
      })
    );

    expect(campaignStore.complianceDecision.create).toHaveBeenCalledTimes(1);
    expect(campaignStore.complianceDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '11111111-1111-1111-1111-111111111111',
          debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          decision: 'block',
          reasonCode: expect.any(String),
          reasonText: expect.any(String),
          ruleVersion: 'v1'
        })
      })
    );

    await app.close();
  });

  it('blocks when consent is pending', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111111/debtors/cccccccc-cccc-cccc-cccc-cccccccccccc/compliance/check',
      headers: { 'x-user-role': 'operator' }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual(
      expect.objectContaining({
        decision: 'block',
        reasons: expect.arrayContaining([
          expect.objectContaining({
            decision: 'block',
            reasonCode: 'CONSENT_PENDING_BLOCK',
            reasonText: 'Consent status is pending',
            blockKind: null
          })
        ]),
        rules: ['call-window', 'consent-status', 'debt-status', 'frequency-limit', 'suppression']
      })
    );

    expect(campaignStore.complianceDecision.create).toHaveBeenCalledTimes(1);
    expect(campaignStore.complianceDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '11111111-1111-1111-1111-111111111111',
          debtorRecordId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          decision: 'block',
          reasonCode: expect.stringContaining('CONSENT_PENDING_BLOCK'),
          reasonText: expect.any(String),
          ruleVersion: 'v1'
        })
      })
    );

    await app.close();
  });

  it('returns 404 when debtor does not belong to tenant', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111111/debtors/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/compliance/check',
      headers: { 'x-user-role': 'operator' }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'DEBTOR_RECORD_NOT_FOUND'
    });

    await app.close();
  });

  it('returns 401 when X-User-Role is missing', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111111/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/compliance/check'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });

    await app.close();
  });

  it('returns 403 when user role is not allowed', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/11111111-1111-1111-1111-111111111111/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/compliance/check',
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
