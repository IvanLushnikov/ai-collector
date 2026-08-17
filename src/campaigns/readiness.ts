import { isProductionTelephonyProbeConfirmed } from '../domain/telephony-connection/index.js';
import { isHandoffDestinationConfigured } from '../domain/handoff-destination/index.js';
import type { ProviderCredential } from '../domain/provider-credential/index.js';
import { env } from '../config/env.js';
import { areSpeechCredentialsReady } from '../speech/credentials/assert-ready.js';
import type { PlatformSpeechEnv } from '../speech/credentials/resolve.js';

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
  providerCredential?: {
    findMany?: (args: unknown) => Promise<unknown>;
  };
  platformEnv?: PlatformSpeechEnv;
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
  lastProbeAt?: string | Date | null;
  probeMarking?: boolean | null;
  probeRecording?: boolean | null;
  probeHandoff?: boolean | null;
  handoffNumber?: string | null;
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

export type CampaignReadinessOptions = {
  channel?: 'sandbox' | 'live';
};

export const evaluateCampaignReadiness = async (
  deps: CampaignReadinessDependencies,
  campaign: CampaignReadinessCampaign,
  tenantId: string,
  options: CampaignReadinessOptions = {}
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
    ...telephonyConnections.map((connection) => Date.parse(connection.updatedAt)),
    ...telephonyConnections.flatMap((connection) => {
      if (!connection.lastProbeAt) {
        return [];
      }
      const lastProbeAt = Date.parse(String(connection.lastProbeAt));
      return Number.isNaN(lastProbeAt) ? [] : [lastProbeAt];
    })
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

  const skipProductionGates = options.channel === 'sandbox';

  if (activeProductionTelephonyConnections.length === 0) {
    if (!skipProductionGates) {
      reasons.push({
        source: 'telephony',
        reasonCode: 'PRODUCTION_TELEPHONY_MISSING',
        reasonText: 'No active production telephony connection is configured',
        nextAction: 'Add or activate a production telephony connection'
      });
    }
  } else if (!skipProductionGates) {
    const unconfirmedProbe = activeProductionTelephonyConnections.find(
      (connection) => !isProductionTelephonyProbeConfirmed(connection)
    );
    if (unconfirmedProbe) {
      reasons.push({
        source: 'telephony',
        reasonCode: 'TELEPHONY_PROBE_INCOMPLETE',
        reasonText: 'Production telephony probe has not confirmed marking, recording and handoff',
        nextAction: 'Run a production probe that confirms marking, recording and handoff; sandboxPass is not live marking'
      });
    }

    const missingHandoff = activeProductionTelephonyConnections.find(
      (connection) => !isHandoffDestinationConfigured({ number: connection.handoffNumber ?? '' })
    );
    if (missingHandoff) {
      reasons.push({
        source: 'telephony',
        reasonCode: 'HANDOFF_UNAVAILABLE_BLOCK',
        reasonText: 'Production telephony has no operator queue destination',
        nextAction: 'Set a handoff number or SIP queue on the production connection'
      });
    }

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

  if (!skipProductionGates) {
    const speechRows = ((await (deps.providerCredential?.findMany?.({
      where: { tenantId }
    }) ?? Promise.resolve([]))) ?? []) as ProviderCredential[];
    const platformEnv = deps.platformEnv ?? {
      YANDEX_SPEECHKIT_API_KEY: env.YANDEX_SPEECHKIT_API_KEY,
      YANDEXGPT_API_KEY: env.YANDEXGPT_API_KEY,
      GIGACHAT_API_KEY: env.GIGACHAT_API_KEY,
      YANDEX_FOLDER_ID: env.YANDEX_FOLDER_ID
    };
    if (!areSpeechCredentialsReady({
      tenantId,
      credentials: speechRows,
      env: platformEnv
    })) {
      reasons.push({
        source: 'speech',
        reasonCode: 'SPEECH_CREDENTIALS_NOT_READY',
        reasonText: 'Speech and model credentials are not ready',
        nextAction: 'Connect speech credentials in integrations'
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
