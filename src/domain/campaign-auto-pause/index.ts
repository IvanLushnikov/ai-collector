import type { CampaignStatus } from '../campaign/index.js';

export type CampaignAutoPauseReasonCode =
  | 'compliance_violation'
  | 'complaint_spike'
  | 'recording_failed'
  | 'handoff_overloaded'
  | 'provider_sla_failed';

export interface CampaignAutoPauseInput {
  tenantId: string;
  campaignId: string;
  reasonCode: CampaignAutoPauseReasonCode;
  reasonText: string;
  triggeredByUserId: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignAutoPauseDependencies {
  campaign: {
    findUnique: (args: { where: { id: string } }) => Promise<{
      id: string;
      tenantId: string;
      status: CampaignStatus;
    } | null>;
    update: (args: {
      where: { id: string };
      data: { status: 'auto_paused' };
      select: { id: true; tenantId: true; status: true };
    }) => Promise<{
      id: string;
      tenantId: string;
      status: CampaignStatus;
    }>;
  };
  auditLog?: {
    create?: (args: {
      data: {
        tenantId: string;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }) => Promise<unknown>;
  };
}

export interface CampaignAutoPauseResult {
  campaignId: string;
  tenantId: string;
  status: CampaignStatus;
  reasonCode: CampaignAutoPauseReasonCode;
}

export class CampaignAutoPauseService {
  private readonly campaign: CampaignAutoPauseDependencies['campaign'];
  private readonly auditLog?: CampaignAutoPauseDependencies['auditLog'];

  public constructor(deps: CampaignAutoPauseDependencies) {
    this.campaign = deps.campaign;
    this.auditLog = deps.auditLog;
  }

  public async pauseCampaign(input: CampaignAutoPauseInput): Promise<CampaignAutoPauseResult> {
    const campaign = await this.campaign.findUnique({
      where: { id: input.campaignId }
    });

    if (!campaign || campaign.tenantId !== input.tenantId) {
      throw new Error('CAMPAIGN_NOT_FOUND');
    }

    if (campaign.status !== 'running') {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const updatedCampaign = await this.campaign.update({
      where: { id: input.campaignId },
      data: {
        status: 'auto_paused'
      },
      select: {
        id: true,
        tenantId: true,
        status: true
      }
    });

    await this.auditLog?.create?.({
      data: {
        tenantId: input.tenantId,
        userId: input.triggeredByUserId,
        action: 'campaign.auto_paused',
        entityType: 'campaign',
        entityId: input.campaignId,
        metadata: {
          reasonCode: input.reasonCode,
          reasonText: input.reasonText,
          source: 'campaign_auto_pause_service',
          metadata: input.metadata ?? {}
        }
      }
    });

    return {
      campaignId: updatedCampaign.id,
      tenantId: updatedCampaign.tenantId,
      status: updatedCampaign.status,
      reasonCode: input.reasonCode
    };
  }
}
