import { expect, it, describe, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('POST /tenants/:tenantId/campaigns/:campaignId/debtors/import', () => {
  const authHeaders = { 'X-User-Role': 'collection_manager' };

  const injectImport = (app: any, request: Record<string, unknown>) =>
    app.inject({
      ...request,
      headers: {
        ...authHeaders,
        ...((request.headers as Record<string, unknown> | undefined) ?? {})
      }
    });
  const makeCampaignStore = () => ({
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
        if (query.where.id === 'campaign-missing') {
          return null;
        }
        return {
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111',
          name: `Campaign ${query.where.id}`,
          status: 'ready',
          timezone: 'UTC',
          createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
        };
      }),
      create: vi.fn(async () => ({
        id: 'campaign-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        name: 'Campaign for import',
        status: 'ready',
        timezone: 'UTC',
        createdByUserId: 'user-1',
        createdAt: new Date('2026-08-16T09:00:00.000Z').toISOString()
      }))
    },
    debtorRecord: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: `debtor-${data.externalId}`,
        ...data
      }))
    },
    user: {
      findFirst: vi.fn(async () => ({ id: 'user-1' }))
    }
  });

  it('imports valid rows and returns report', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectImport(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/debtors/import',
      payload: {
        csvContent: 'externalId,phone,timezone,debtAmount,debtStatus,consentStatus\n'
          + 'AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given\n'
          + 'CD-1002,+7 903 222 11 22,Asia/Yekaterinburg,5600,active,pending'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual({
      acceptedCount: 2,
      rejectedCount: 0,
      errors: []
    });
    expect(campaignStore.debtorRecord.create).toHaveBeenCalledTimes(2);
    expect(campaignStore.debtorRecord.create).toHaveBeenNthCalledWith(1, {
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-1',
        externalId: 'AB-1001',
        phone: '+79501234567',
        timezone: 'Europe/Moscow',
        debtAmount: 15320.5,
        debtStatus: 'active',
        consentStatus: 'given',
        displayName: null,
        agreementRef: null
      }
    });

    await app.close();
  });

  it('persists optional identity columns tenant-scoped', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectImport(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/debtors/import',
      payload: {
        csvContent: 'externalId,phone,timezone,debtAmount,debtStatus,consentStatus,displayName,agreementRef\n'
          + 'AB-1001,+7 (950) 123-45-67,Europe/Moscow,15320.50,active,given,Иванов И.И.,ДГ-4412\n'
          + 'CD-1002,+7 903 222 11 22,Asia/Yekaterinburg,5600,active,pending,,'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      acceptedCount: 2,
      rejectedCount: 0,
      errors: []
    });
    expect(campaignStore.debtorRecord.create).toHaveBeenNthCalledWith(1, {
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-1',
        externalId: 'AB-1001',
        phone: '+79501234567',
        timezone: 'Europe/Moscow',
        debtAmount: 15320.5,
        debtStatus: 'active',
        consentStatus: 'given',
        displayName: 'Иванов И.И.',
        agreementRef: 'ДГ-4412'
      }
    });
    expect(campaignStore.debtorRecord.create).toHaveBeenNthCalledWith(2, {
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-1',
        externalId: 'CD-1002',
        phone: '+79032221122',
        timezone: 'Asia/Yekaterinburg',
        debtAmount: 5600,
        debtStatus: 'active',
        consentStatus: 'pending',
        displayName: null,
        agreementRef: null
      }
    });

    await app.close();
  });

  it('returns 404 when campaign does not belong to tenant', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectImport(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-missing/debtors/import',
      payload: {
        csvContent: 'externalId,phone,timezone,debtAmount,debtStatus,consentStatus\nAB-1001,+7 1111111,Europe/Moscow,100,active,given'
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'CAMPAIGN_NOT_FOUND' });
    await app.close();
  });

  it('returns report with debtAmount validation errors', async () => {
    const campaignStore = makeCampaignStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectImport(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-1/debtors/import',
      payload: {
        csvContent: 'externalId,phone,timezone,debtAmount,debtStatus,consentStatus\nAB-1001,+7 1111111,Europe/Moscow,invalid-amount,active,given'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.acceptedCount).toBe(0);
    expect(body.rejectedCount).toBe(1);
    expect(body.errors).toEqual([
      {
        row: 2,
        field: 'debtAmount',
        message: 'Debt amount is invalid'
      }
    ]);
    expect(campaignStore.debtorRecord.create).not.toHaveBeenCalled();

    await app.close();
  });
});
