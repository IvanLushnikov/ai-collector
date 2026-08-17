export type CampaignReadinessReason = {
  source: string;
  reasonCode: string;
  reasonText: string;
  nextAction: string;
};

export type CampaignReadinessCampaign = {
  id: string;
  tenantId: string;
  status: string;
  updatedAt: string;
  telephonyConnectionId?: string | null;
};

export type CampaignReadinessDependencies = {
  tenant?: {
    findUnique?: (args: unknown) => Promise<unknown>;
  };
  debtorRecord?: {
    count?: (args: unknown) => Promise<number>;
  };
  scriptVersion?: {
    findMany?: (args: unknown) => Promise<unknown>;
  };
  telephonyConnection?: {
    findUnique?: (args: unknown) => Promise<unknown>;
  };
  complianceDecision?: {
    count?: (args: unknown) => Promise<number>;
    findMany?: (args: unknown) => Promise<unknown>;
  };
};

export type CampaignReadinessSummary = {
  campaignId: string;
  campaignStatus: string;
  source: 'campaign-readiness-v1';
  timestamp: string;
  readinessHash: string;
  readinessState: 'ready' | 'stale' | 'blocked';
  blocked: boolean;
  stale: boolean;
  reasons: CampaignReadinessReason[];
  complianceReasons: Array<{
    id: string;
    reasonCode: string;
    reasonText: string;
    checkedAt: string;
  }>;
};

type TelephonyConnectionRecord = {
  id: string;
  tenantId: string;
  mode: string;
  status: string;
  updatedAt: string;
};

const findTenantTelephonyConnection = async (
  deps: CampaignReadinessDependencies,
  tenantId: string,
  telephonyConnectionId: string
): Promise<TelephonyConnectionRecord | null> => {
  const connection = await deps.telephonyConnection?.findUnique?.({
    where: { id: telephonyConnectionId }
  }) as TelephonyConnectionRecord | null | undefined;

  if (!connection || connection.tenantId !== tenantId) {
    return null;
  }

  return connection;
};

export const evaluateCampaignReadiness = async (
  deps: CampaignReadinessDependencies,
  campaign: CampaignReadinessCampaign,
  tenantId: string
): Promise<CampaignReadinessSummary> => {
  const [rawDebtorCount, rawScriptVersions, selectedTelephonyConnection, complianceBlocks, rawComplianceReasons, tenant] = await Promise.all([
    (deps.debtorRecord?.count?.({ where: { campaignId: campaign.id } }) ?? Promise.resolve(0)),
    (deps.scriptVersion?.findMany?.({
      where: { campaignId: campaign.id },
      select: {
        status: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    }) ?? Promise.resolve([])),
    campaign.telephonyConnectionId
      ? findTenantTelephonyConnection(deps, tenantId, campaign.telephonyConnectionId)
      : Promise.resolve(null),
    (deps.complianceDecision?.count?.({
      where: {
        campaignId: campaign.id,
        decision: 'block'
      }
    }) ?? Promise.resolve(0)),
    (deps.complianceDecision?.findMany?.({
      where: {
        campaignId: campaign.id,
        decision: 'block'
      },
      orderBy: {
        checkedAt: 'desc'
      },
      take: 3,
      select: {
        id: true,
        reasonCode: true,
        reasonText: true,
        checkedAt: true
      }
    }) ?? Promise.resolve([])),
    (deps.tenant?.findUnique?.({ where: { id: tenantId } }) ?? Promise.resolve(null))
  ]);

  const debtorRecordsCount = rawDebtorCount as number;
  const scriptVersions = rawScriptVersions as Array<{ status: string; updatedAt: string }>;
  const telephonyConnections = selectedTelephonyConnection ? [selectedTelephonyConnection] : [];
  const complianceBlockReasons = rawComplianceReasons as Array<{
    id: string;
    reasonCode: string;
    reasonText: string;
    checkedAt: string;
  }>;

  const activeScriptVersions = scriptVersions.filter((scriptVersion) => scriptVersion.status === 'active');
  const activeProductionTelephonyConnections = telephonyConnections.filter(
    (connection) => connection.mode === 'production' && connection.status === 'active'
  );
  const campaignUpdatedAt = Date.parse(campaign.updatedAt);
  const readinessLastUpdatedAt = Math.max(
    campaignUpdatedAt,
    ...scriptVersions.map((scriptVersion) => Date.parse(scriptVersion.updatedAt)),
    ...telephonyConnections.map((connection) => Date.parse(connection.updatedAt))
  );

  const reasons: CampaignReadinessReason[] = [];
  if (debtorRecordsCount === 0) {
    reasons.push({
      source: 'debtors',
      reasonCode: 'DEBTORS_MISSING',
      reasonText: 'No debtor records are imported for this campaign',
      nextAction: 'Upload debtor records via CSV import'
    });
  }

  if (activeScriptVersions.length === 0) {
    reasons.push({
      source: 'script',
      reasonCode: 'SCRIPT_NOT_READY',
      reasonText: 'No active script version is available for this campaign',
      nextAction: 'Create and activate a script version'
    });
  }

  if (activeProductionTelephonyConnections.length === 0) {
    reasons.push({
      source: 'telephony',
      reasonCode: 'PRODUCTION_TELEPHONY_MISSING',
      reasonText: 'No active production telephony connection is configured',
      nextAction: 'Add or activate a production telephony connection'
    });
  } else {
    const legalBasisStatus = (tenant as { legalBasisStatus?: string } | null)?.legalBasisStatus ?? 'pending';
    if (legalBasisStatus !== 'confirmed') {
      reasons.push({
        source: 'legal',
        reasonCode: 'LEGAL_BASIS_NOT_CONFIRMED',
        reasonText: 'Production telephony requires a confirmed legal basis for automatic dialing',
        nextAction: 'Keep sandbox until legal basis is confirmed by an admin path'
      });
    }
  }

  if (complianceBlocks > 0) {
    reasons.push({
      source: 'compliance',
      reasonCode: 'COMPLIANCE_BLOCKS_DETECTED',
      reasonText: 'Campaign has blocking compliance decisions',
      nextAction: 'Resolve blocking compliance reasons and re-check readiness'
    });
  }

  if (!['review', 'ready', 'running', 'auto_paused'].includes(campaign.status)) {
    reasons.push({
      source: 'campaign',
      reasonCode: 'CAMPAIGN_STATUS_INVALID',
      reasonText: `Campaign status ${campaign.status} is not eligible for launch`,
      nextAction: campaign.status === 'archived' || campaign.status === 'completed'
        ? 'Restore campaign status before launch'
        : 'Run campaign through draft → review → ready before launch'
    });
  }

  const blocked = reasons.length > 0;
  const stale = readinessLastUpdatedAt > campaignUpdatedAt;
  const readinessState = blocked ? 'blocked' : stale ? 'stale' : 'ready';
  const readinessHash = [
    campaign.id,
    debtorRecordsCount,
    activeScriptVersions.length,
    activeProductionTelephonyConnections.length,
    complianceBlocks,
    campaignUpdatedAt,
    readinessLastUpdatedAt
  ].join('|');

  return {
    campaignId: campaign.id,
    campaignStatus: campaign.status,
    source: 'campaign-readiness-v1',
    timestamp: new Date().toISOString(),
    readinessHash,
    readinessState,
    blocked,
    stale,
    reasons,
    complianceReasons: complianceBlockReasons
  };
};
