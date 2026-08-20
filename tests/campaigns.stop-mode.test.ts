import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

const tenantId = '11111111-1111-1111-1111-111111111111';

const makeRunningStore = () => {
  const auditCreate = vi.fn(async () => ({ id: 'audit-1' }));
  return {
    tenant: {
      findUnique: vi.fn(async () => ({ id: tenantId, legalBasisStatus: 'confirmed' }))
    },
    user: {
      findFirst: vi.fn(async () => ({ id: 'user-1' }))
    },
    campaign: {
      create: vi.fn(),
      findUnique: vi.fn(async () => ({
        id: 'campaign-run',
        tenantId,
        name: 'Running',
        status: 'running',
        timezone: 'UTC',
        createdAt: '2026-08-16T09:00:00.000Z'
      })),
      update: vi.fn(async ({ data, where }: { data: { status: string }; where: { id: string } }) => ({
        id: where.id,
        tenantId,
        name: 'Running',
        status: data.status,
        timezone: 'UTC',
        createdAt: '2026-08-16T09:00:00.000Z'
      }))
    },
    auditLog: {
      create: auditCreate
    }
  };
};

describe('PATCH campaign status stopMode (OP-T-002b)', () => {
  it('defaults completed stop to graceful and audits stopMode', async () => {
    const campaignStore = makeRunningStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/campaign-run/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'completed',
      stopMode: 'graceful'
    });
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.status_updated',
        metadata: expect.objectContaining({
          fromStatus: 'running',
          toStatus: 'completed',
          stopMode: 'graceful'
        })
      })
    });

    await app.close();
  });

  it('accepts force stopMode without inventing stopped status or bypassing auto_paused', async () => {
    const campaignStore = makeRunningStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/campaign-run/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'force' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'completed',
      stopMode: 'force'
    });
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.status_updated',
        metadata: expect.objectContaining({
          toStatus: 'completed',
          stopMode: 'force',
          forceInterruptsActiveAttempts: true,
          complianceBypass: false
        })
      })
    });

    await app.close();
  });

  it('rejects force stop from auto_paused (safe-resume required)', async () => {
    const campaignStore = makeRunningStore();
    campaignStore.campaign.findUnique = vi.fn(async () => ({
      id: 'campaign-paused',
      tenantId,
      name: 'Paused',
      status: 'auto_paused',
      timezone: 'UTC',
      createdAt: '2026-08-16T09:00:00.000Z'
    }));

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/campaign-paused/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'force' }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('INVALID_STATUS_TRANSITION');
    expect(campaignStore.campaign.update).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects unknown stopMode', async () => {
    const campaignStore = makeRunningStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/campaign-run/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'nuke' }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('VALIDATION_ERROR');

    await app.close();
  });
});
