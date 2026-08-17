import { describe, expect, it, vi } from 'vitest';
import {
  defaultCampaignBillingRates
} from '../../src/domain/billing/index.js';
import { createCampaignReport } from '../../src/reports/campaign-report.js';

describe('createCampaignReport', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const campaignId = '22222222-2222-2222-2222-222222222222';

  const makeDeps = () => ({
    debtorRecord: {
      count: vi.fn(async ({ where }: { where: { tenantId: string; campaignId: string } }) => {
        expect(where.tenantId).toBe(tenantId);
        expect(where.campaignId).toBe(campaignId);
        return 15;
      })
    },
    callAttempt: {
      count: vi.fn(async ({ where }: { where: { tenantId: string; campaignId: string; status?: string } }) => {
        expect(where.tenantId).toBe(tenantId);
        expect(where.campaignId).toBe(campaignId);

        if (where.status === 'completed') {
          return 6;
        }

        return 12;
      })
    },
    callResult: {
      count: vi.fn(async ({ where }: { where: { tenantId: string; callAttempt: { campaignId: string }; outcome: string } }) => {
        expect(where.tenantId).toBe(tenantId);
        expect(where.callAttempt.campaignId).toBe(campaignId);
        expect(where.outcome).toBe('ptp_created');
        return 4;
      })
    },
    complianceDecision: {
      count: vi.fn(async ({ where }: { where: { tenantId: string; campaignId: string; decision: string } }) => {
        expect(where.tenantId).toBe(tenantId);
        expect(where.campaignId).toBe(campaignId);
        expect(where.decision).toBe('block');
        return 2;
      })
    },
    usageEvent: {
      findMany: vi.fn(async ({ where }: { where: { tenantId: string; campaignId: string } }) => {
        expect(where.tenantId).toBe(tenantId);
        expect(where.campaignId).toBe(campaignId);

        return [
          {
            tenantId,
            campaignId,
            eventType: 'call_completed',
            unit: 'minute',
            sourceId: 'usage-1',
            quantity: 5
          },
          {
            tenantId,
            campaignId,
            eventType: 'call_completed',
            unit: 'minute',
            sourceId: 'usage-2',
            quantity: 1
          },
          {
            tenantId,
            campaignId,
            eventType: 'call_completed',
            unit: 'call',
            sourceId: 'usage-3',
            quantity: 4
          }
        ];
      }),
      count: vi.fn(async ({ where }: { where: { tenantId: string; campaignId: string; eventType: string } }) => {
        expect(where.tenantId).toBe(tenantId);
        expect(where.campaignId).toBe(campaignId);
        expect(where.eventType).toBe('call_completed');
        return 3;
      })
    }
  });

  it('counts report metrics from tenant-scoped data', async () => {
    const report = await createCampaignReport(makeDeps(), {
      tenantId,
      campaignId
    });
    const expectedCostPerCall = (6 * defaultCampaignBillingRates.connectedMinuteRateRub) / 4;
    const expectedCostPerPtp = (6 * defaultCampaignBillingRates.connectedMinuteRateRub) / 4;

    expect(report).toEqual({
      totalRecords: 15,
      attemptedCalls: 12,
      completedCalls: 4,
      blockedCalls: 2,
      ptpCount: 4,
      connectedMinutes: 6,
      costPerCall: expectedCostPerCall,
      costPerPtp: expectedCostPerPtp
    });
  });

  it('uses provided billing rates in cost calculations', async () => {
    const report = await createCampaignReport(makeDeps(), {
      tenantId,
      campaignId,
      billingRates: {
        connectedMinuteRateRub: 2
      }
    });

    expect(report.costPerCall).toBe(3);
    expect(report.costPerPtp).toBe(3);
  });

  it('falls back to call_attempt.completed when usage events store does not provide usage metrics', async () => {
    const deps = makeDeps();
    // @ts-expect-error intentionally emulate missing optional usageEvent counter
    deps.usageEvent = undefined;

    const report = await createCampaignReport(deps, {
      tenantId,
      campaignId
    });

    expect(report.completedCalls).toBe(6);
    expect(report.connectedMinutes).toBe(0);
    expect(report.costPerCall).toBeNull();
    expect(report.costPerPtp).toBeNull();
  });
});
