import { describe, expect, it, vi } from 'vitest';
import { CampaignAutoPauseService } from '../src/domain/campaign-auto-pause/index.js';
import type { CampaignStatus } from '../src/domain/campaign/index.js';

  const makeStore = () => ({
    campaign: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => ({
        id: query.where.id,
        tenantId: '11111111-1111-1111-1111-111111111111',
        status: 'running' as CampaignStatus
      })),
      update: vi.fn(async () => ({
        id: 'campaign-1',
        tenantId: '11111111-1111-1111-1111-111111111111',
        status: 'auto_paused' as CampaignStatus
      }))
  },
  auditLog: {
    create: vi.fn(async () => ({}))
  }
});

describe('CampaignAutoPauseService', () => {
  it('pauses running campaign and writes audit log with reason code', async () => {
    const store = makeStore();
    const service = new CampaignAutoPauseService(store);

    const result = await service.pauseCampaign({
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: 'campaign-1',
      reasonCode: 'compliance_violation',
      reasonText: 'Compliance blocking rate exceeded',
      triggeredByUserId: 'user-1',
      metadata: {
        trigger: 'compliance.blocking_rate_exceeded'
      }
    });

    expect(result).toEqual({
      campaignId: 'campaign-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'auto_paused',
      reasonCode: 'compliance_violation'
    });
    expect(store.campaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: {
        status: 'auto_paused'
      },
      select: {
        id: true,
        tenantId: true,
        status: true
      }
    });
    expect(store.auditLog.create).toHaveBeenCalledOnce();
    expect(store.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        action: 'campaign.auto_paused',
        entityType: 'campaign',
        entityId: 'campaign-1',
        metadata: expect.objectContaining({
          actorType: 'system',
          reasonCode: 'compliance_violation',
          reasonText: 'Compliance blocking rate exceeded',
          source: 'campaign_auto_pause_service',
          metadata: {
            trigger: 'compliance.blocking_rate_exceeded'
          }
        })
      })
    });
  });

  it('throws when campaign is not in running status', async () => {
    const store = makeStore();
    store.campaign.findUnique = vi.fn(async () => ({
      id: 'campaign-1',
      tenantId: '11111111-1111-1111-1111-111111111111',
      status: 'ready' as CampaignStatus
    }));

    const service = new CampaignAutoPauseService(store);

    await expect(
      service.pauseCampaign({
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-1',
        reasonCode: 'complaint_spike',
        reasonText: 'Complaint spike detected',
        triggeredByUserId: 'user-1'
      })
    ).rejects.toThrowError('INVALID_STATUS_TRANSITION');
    expect(store.campaign.update).not.toHaveBeenCalled();
    expect(store.auditLog.create).not.toHaveBeenCalled();
  });

  it('throws when campaign does not belong to tenant', async () => {
    const store = makeStore();
    store.campaign.findUnique = vi.fn(async () => ({
      id: 'campaign-1',
      tenantId: '22222222-2222-2222-2222-222222222222',
      status: 'running' as CampaignStatus
    }));

    const service = new CampaignAutoPauseService(store);

    await expect(
      service.pauseCampaign({
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: 'campaign-1',
        reasonCode: 'provider_sla_failed',
        reasonText: 'SLA miss detected',
        triggeredByUserId: 'user-1'
      })
    ).rejects.toThrowError('CAMPAIGN_NOT_FOUND');
    expect(store.campaign.update).not.toHaveBeenCalled();
    expect(store.auditLog.create).not.toHaveBeenCalled();
  });

  it('pauses a running campaign when live recording evidence is missing', async () => {
    const store = makeStore();
    const service = new CampaignAutoPauseService(store);

    const result = await service.pauseCampaign({
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: 'campaign-1',
      reasonCode: 'recording_failed',
      reasonText: 'Answered live call has no recording or transcript URL',
      triggeredByUserId: 'user-1'
    });

    expect(result.reasonCode).toBe('recording_failed');
    expect(result.status).toBe('auto_paused');
    expect(store.campaign.update).toHaveBeenCalledOnce();
  });
});
