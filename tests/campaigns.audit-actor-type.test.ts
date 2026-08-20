import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { CampaignAutoPauseService } from '../src/domain/campaign-auto-pause/index.js';
import type { CampaignStatus } from '../src/domain/campaign/index.js';

const tenantId = '11111111-1111-1111-1111-111111111111';

describe('audit metadata actorType (OP-T-010)', () => {
  it('writes actorType user and actorRole on campaign.status_updated', async () => {
    const auditCreate = vi.fn(async () => ({ id: 'audit-1' }));
    const campaignStore: any = {
      tenant: {
        findUnique: vi.fn(async () => ({ id: tenantId, legalBasisStatus: 'confirmed' }))
      },
      user: {
        findFirst: vi.fn(async () => ({ id: 'user-1' }))
      },
      campaign: {
        create: vi.fn(),
        findUnique: vi.fn(async () => ({
          id: 'campaign-draft',
          tenantId,
          status: 'draft'
        })),
        update: vi.fn(async ({ data, where }: { data: { status: string }; where: { id: string } }) => ({
          id: where.id,
          tenantId,
          name: 'Draft',
          status: data.status,
          timezone: 'UTC',
          createdAt: '2026-08-16T09:00:00.000Z'
        }))
      },
      auditLog: { create: auditCreate }
    };

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/campaign-draft/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'review' }
    });

    expect(response.statusCode).toBe(200);
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.status_updated',
        metadata: expect.objectContaining({
          actorType: 'user',
          actorRole: 'tenant_owner',
          fromStatus: 'draft',
          toStatus: 'review'
        })
      })
    });

    await app.close();
  });

  it('writes actorType user and actorRole on campaign.safe_resumed', async () => {
    const auditCreate = vi.fn(async () => ({ id: 'audit-1' }));
    const campaignStore: any = {
      tenant: {
        findUnique: vi.fn(async () => ({ id: tenantId }))
      },
      user: {
        findFirst: vi.fn(async () => ({ id: 'user-1' }))
      },
      campaign: {
        create: vi.fn(),
        findUnique: vi.fn(async () => ({
          id: 'campaign-paused',
          tenantId,
          status: 'auto_paused'
        })),
        update: vi.fn(async ({ data, where }: { data: { status: string }; where: { id: string } }) => ({
          id: where.id,
          tenantId,
          name: 'Paused',
          status: data.status,
          timezone: 'UTC',
          createdAt: '2026-08-16T09:00:00.000Z'
        }))
      },
      auditLog: { create: auditCreate }
    };

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/campaigns/campaign-paused/safe-resume`,
      headers: { 'X-User-Role': 'compliance_officer' },
      payload: {
        targetStatus: 'review',
        checklist: {
          reasonAcknowledged: true,
          causeResolved: true,
          ownerApproved: true
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.safe_resumed',
        metadata: expect.objectContaining({
          actorType: 'user',
          actorRole: 'compliance_officer',
          reason: 'safe_resume'
        })
      })
    });

    await app.close();
  });

  it('writes actorType system on campaign.auto_paused', async () => {
    const store = {
      campaign: {
        findUnique: vi.fn(async () => ({
          id: 'campaign-1',
          tenantId,
          status: 'running' as CampaignStatus
        })),
        update: vi.fn(async () => ({
          id: 'campaign-1',
          tenantId,
          status: 'auto_paused' as CampaignStatus
        }))
      },
      auditLog: {
        create: vi.fn(async () => ({}))
      }
    };

    const service = new CampaignAutoPauseService(store);
    await service.pauseCampaign({
      tenantId,
      campaignId: 'campaign-1',
      reasonCode: 'recording_failed',
      reasonText: 'No recording',
      triggeredByUserId: 'user-1'
    });

    expect(store.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.auto_paused',
        metadata: expect.objectContaining({
          actorType: 'system',
          reasonCode: 'recording_failed'
        })
      })
    });
  });
});
