import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

describe('GET /tenants/:tenantId/campaigns progress.completedCalls (OP-T-008)', () => {
  it('uses usage ledger call_completed quantities when usageEvent.findMany is available', async () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const campaignStore: any = {
      tenant: {
        findUnique: vi.fn(async () => ({ id: tenantId, legalBasisStatus: 'confirmed' }))
      },
      user: {
        findFirst: vi.fn(async () => ({ id: 'user-1' }))
      },
      campaign: {
        findMany: vi.fn(async () => [
          {
            id: 'campaign-ledger',
            name: 'Ledger campaign',
            status: 'running',
            timezone: 'UTC',
            createdAt: '2026-08-10T10:00:00.000Z',
            updatedAt: '2026-08-18T12:00:00.000Z'
          }
        ])
      },
      auditLog: {
        findMany: vi.fn(async () => [])
      },
      debtorRecord: {
        count: vi.fn(async () => 100)
      },
      callAttempt: {
        count: vi.fn(async () => 60)
      },
      usageEvent: {
        findMany: vi.fn(async () => [
          {
            tenantId,
            campaignId: 'campaign-ledger',
            eventType: 'call_completed',
            unit: 'call',
            sourceId: 'usage-1',
            quantity: 3
          },
          {
            tenantId,
            campaignId: 'campaign-ledger',
            eventType: 'call_completed',
            unit: 'call',
            sourceId: 'usage-2',
            quantity: 2
          }
        ])
      }
    };

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/campaigns`,
      headers: { 'X-User-Role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()[0].progress).toEqual({
      attemptedCalls: 60,
      completedCalls: 5,
      totalRecords: 100
    });

    await app.close();
  });
});
