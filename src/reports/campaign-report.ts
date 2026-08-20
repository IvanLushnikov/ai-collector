import { calculateUsageLedgerTotals } from '../domain/usage-ledger/index.js';
import {
  calculateCostFromMinutes,
  defaultCampaignBillingRates
} from '../domain/billing/index.js';
import type { UsageEventType } from '../domain/usage-event/index.js';

export type CampaignReport = {
  totalRecords: number;
  attemptedCalls: number;
  completedCalls: number;
  blockedCalls: number;
  ptpCount: number;
  paidAfterPtpCount: number;
  connectedMinutes: number;
  costPerCall: number | null;
  costPerPtp: number | null;
};

type UsageEventWhere = {
  tenantId: string;
  campaignId: string;
  eventType: string;
  unit?: string;
};

type UsageEventRecord = {
  tenantId: string;
  campaignId: string;
  eventType: UsageEventType;
  quantity: number;
  unit: string;
  sourceId: string;
};

export type CampaignCompletedCallsDependencies = {
  callAttempt: {
    count: (args: {
      where: {
        tenantId: string;
        campaignId: string;
        status?: string;
      };
    }) => Promise<number>;
  };
  usageEvent?: {
    count?: (args: { where: UsageEventWhere }) => Promise<number>;
    findMany?: (args: {
      where: { tenantId: string; campaignId: string };
      select: { sourceId: true; eventType: true; quantity: true; unit: true };
    }) => Promise<UsageEventRecord[]>;
  };
};

type CampaignReportDependencies = CampaignCompletedCallsDependencies & {
  debtorRecord: {
    count: (args: { where: { tenantId: string; campaignId: string } }) => Promise<number>;
  };
  callResult: {
    count: (args: {
      where: {
        tenantId: string;
        callAttempt: {
          campaignId: string;
        };
        outcome: string;
        paymentOutcome?: string;
      };
    }) => Promise<number>;
  };
  complianceDecision: {
    count: (args: {
      where: {
        tenantId: string;
        campaignId: string;
        decision: string;
      };
    }) => Promise<number>;
  };
};

export const countCampaignCompletedCalls = async (
  deps: CampaignCompletedCallsDependencies,
  args: {
    tenantId: string;
    campaignId: string;
  }
): Promise<number> => {
  const whereAttemptScope = {
    tenantId: args.tenantId,
    campaignId: args.campaignId
  };

  if (deps.usageEvent?.findMany) {
    const usageLedgerTotals = await calculateUsageLedgerTotals(
      {
        usageEvent: {
          findMany: (query) => deps.usageEvent!.findMany!({
            where: {
              tenantId: query.where.tenantId,
              campaignId: query.where.campaignId
            },
            select: {
              sourceId: true,
              eventType: true,
              quantity: true,
              unit: true
            }
          })
        }
      },
      {
        tenantId: args.tenantId,
        campaignId: args.campaignId
      }
    ).then((result) => result.totals);

    return usageLedgerTotals
      .filter((item) => item.eventType === 'call_completed' && item.unit === 'call')
      .reduce((sum, item) => sum + (item.totalQuantity ?? 0), 0);
  }

  if (deps.usageEvent?.count) {
    return deps.usageEvent.count({
      where: {
        ...whereAttemptScope,
        eventType: 'call_completed'
      }
    });
  }

  return deps.callAttempt.count({
    where: {
      ...whereAttemptScope,
      status: 'completed'
    }
  });
};

export const createCampaignReport = async (
  deps: CampaignReportDependencies,
  args: {
    tenantId: string;
    campaignId: string;
    billingRates?: {
      connectedMinuteRateRub: number;
    };
  }
): Promise<CampaignReport> => {
  const whereAttemptScope = {
    tenantId: args.tenantId,
    campaignId: args.campaignId
  };

  const billingRates = args.billingRates ?? defaultCampaignBillingRates;

  const hasUsageLedger = Boolean(deps.usageEvent?.findMany);

  const usageLedgerTotals = deps.usageEvent?.findMany
    ? await calculateUsageLedgerTotals(
      {
        usageEvent: {
          findMany: (query) => deps.usageEvent!.findMany!({
            where: {
              tenantId: query.where.tenantId,
              campaignId: query.where.campaignId
            },
            select: {
              sourceId: true,
              eventType: true,
              quantity: true,
              unit: true
            }
          })
        }
      },
      {
        tenantId: args.tenantId,
        campaignId: args.campaignId
      }
    ).then((result) => result.totals)
    : [];

  const connectedMinutes = usageLedgerTotals
    .filter((item) => item.eventType === 'call_completed' && item.unit === 'minute')
    .reduce((sum, item) => sum + (item.totalQuantity ?? 0), 0);

  const [totalRecords, attemptedCalls, completedCalls, blockedCalls, ptpCount, paidAfterPtpCount] = await Promise.all([
    deps.debtorRecord.count({
      where: whereAttemptScope
    }),
    deps.callAttempt.count({
      where: whereAttemptScope
    }),
    countCampaignCompletedCalls(deps, args),
    deps.complianceDecision.count({
      where: {
        ...whereAttemptScope,
        decision: 'block'
      }
    }),
    deps.callResult.count({
      where: {
        tenantId: args.tenantId,
        callAttempt: {
          campaignId: args.campaignId
        },
        outcome: 'ptp_created'
      }
    }),
    deps.callResult.count({
      where: {
        tenantId: args.tenantId,
        callAttempt: {
          campaignId: args.campaignId
        },
        outcome: 'ptp_created',
        paymentOutcome: 'received'
      }
    })
  ]);

  const costPerCall = hasUsageLedger
    ? calculateCostFromMinutes(
      connectedMinutes,
      completedCalls,
      billingRates
    )
    : null;
  const costPerPtp = hasUsageLedger
    ? calculateCostFromMinutes(
      connectedMinutes,
      ptpCount,
      billingRates
    )
    : null;

  return {
    totalRecords,
    attemptedCalls,
    completedCalls,
    blockedCalls,
    ptpCount,
    paidAfterPtpCount,
    connectedMinutes,
    costPerCall,
    costPerPtp
  };
};
