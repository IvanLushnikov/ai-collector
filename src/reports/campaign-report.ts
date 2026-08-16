export type CampaignReport = {
  totalRecords: number;
  attemptedCalls: number;
  completedCalls: number;
  blockedCalls: number;
  ptpCount: number;
};

type UsageEventWhere = {
  tenantId: string;
  campaignId: string;
  eventType: string;
};

type CampaignReportDependencies = {
  debtorRecord: {
    count: (args: { where: { tenantId: string; campaignId: string } }) => Promise<number>;
  };
  callAttempt: {
    count: (args: {
      where: {
        tenantId: string;
        campaignId: string;
        status?: string;
      };
    }) => Promise<number>;
  };
  callResult: {
    count: (args: {
      where: {
        tenantId: string;
        callAttempt: {
          campaignId: string;
        };
        outcome: string;
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
  usageEvent?: {
    count?: (args: { where: UsageEventWhere }) => Promise<number>;
  };
};

export const createCampaignReport = async (
  deps: CampaignReportDependencies,
  args: {
    tenantId: string;
    campaignId: string;
  }
): Promise<CampaignReport> => {
  const whereAttemptScope = {
    tenantId: args.tenantId,
    campaignId: args.campaignId
  };

  const [totalRecords, attemptedCalls, completedCalls, blockedCalls, ptpCount] = await Promise.all([
    deps.debtorRecord.count({
      where: whereAttemptScope
    }),
    deps.callAttempt.count({
      where: whereAttemptScope
    }),
    deps.usageEvent?.count
      ? deps.usageEvent.count({
          where: {
            ...whereAttemptScope,
            eventType: 'call_completed'
          }
        })
      : deps.callAttempt.count({
          where: {
            ...whereAttemptScope,
            status: 'completed'
          }
        }),
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
    })
  ]);

  return {
    totalRecords,
    attemptedCalls,
    completedCalls,
    blockedCalls,
    ptpCount
  };
};
