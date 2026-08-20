import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

describe('GET /tenants/:tenantId/campaigns ops list fields (OP-T-001)', () => {
  it('returns additive updatedAt, statusReason and progress for table rows', async () => {
    const campaignStore: any = {
      tenant: {
        findUnique: vi.fn(async () => ({ id: '11111111-1111-1111-1111-111111111111', legalBasisStatus: 'confirmed' }))
      },
      user: {
        findFirst: vi.fn(async () => ({ id: 'user-1' }))
      },
      campaign: {
        create: vi.fn(),
        findMany: vi.fn(async () => [
          {
            id: 'campaign-running',
            name: 'Running',
            status: 'running',
            timezone: 'UTC',
            createdAt: '2026-08-10T10:00:00.000Z',
            updatedAt: '2026-08-18T12:00:00.000Z'
          },
          {
            id: 'campaign-paused',
            name: 'Paused by system',
            status: 'auto_paused',
            timezone: 'Europe/Moscow',
            createdAt: '2026-08-11T10:00:00.000Z',
            updatedAt: '2026-08-19T09:30:00.000Z'
          }
        ])
      },
      auditLog: {
        create: vi.fn(),
        findMany: vi.fn(async ({ where }: { where: { entityId?: { in: string[] }; action?: string } }) => {
          const ids = where.entityId?.in ?? [];
          if (!ids.includes('campaign-paused') || where.action !== 'campaign.auto_paused') {
            return [];
          }
          return [
            {
              entityId: 'campaign-paused',
              createdAt: '2026-08-19T09:30:00.000Z',
              metadata: {
                reasonCode: 'recording_failed',
                reasonText: 'Нет записи разговора'
              }
            }
          ];
        })
      },
      debtorRecord: {
        count: vi.fn(async ({ where }: { where: { campaignId: string } }) => {
          if (where.campaignId === 'campaign-running') return 10000;
          if (where.campaignId === 'campaign-paused') return 4200;
          return 0;
        })
      },
      callAttempt: {
        count: vi.fn(async ({ where }: { where: { campaignId: string } }) => {
          if (where.campaignId === 'campaign-running') return 6800;
          if (where.campaignId === 'campaign-paused') return 1974;
          return 0;
        })
      }
    };

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns',
      headers: { 'X-User-Role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: 'campaign-running',
        name: 'Running',
        status: 'running',
        timezone: 'UTC',
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-18T12:00:00.000Z',
        statusReason: null,
        progress: { attemptedCalls: 6800, totalRecords: 10000 }
      },
      {
        id: 'campaign-paused',
        name: 'Paused by system',
        status: 'auto_paused',
        timezone: 'Europe/Moscow',
        createdAt: '2026-08-11T10:00:00.000Z',
        updatedAt: '2026-08-19T09:30:00.000Z',
        statusReason: 'Нет записи разговора',
        progress: { attemptedCalls: 1974, totalRecords: 4200 }
      }
    ]);

    expect(campaignStore.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          updatedAt: true
        })
      })
    );

    await app.close();
  });
});
