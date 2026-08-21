import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import { SandboxVoiceProvider } from '../src/telephony/sandbox-provider/index.js';
import { createVoiceProviderResolver } from '../src/telephony/voice-provider/resolver.js';

const tenantId = '11111111-1111-1111-1111-111111111111';
const campaignId = 'campaign-run';
const connectionId = 'conn-sandbox';

const makeRunningStore = (overrides: {
  callAttemptFindMany?: ReturnType<typeof vi.fn>;
  callAttemptUpdate?: ReturnType<typeof vi.fn>;
  telephonyConnectionFindUnique?: ReturnType<typeof vi.fn>;
} = {}) => {
  const auditCreate = vi.fn(async () => ({ id: 'audit-1' }));
  const callAttemptFindMany = overrides.callAttemptFindMany ?? vi.fn(async () => []);
  const callAttemptUpdate = overrides.callAttemptUpdate ?? vi.fn(async () => ({}));
  const telephonyConnectionFindUnique = overrides.telephonyConnectionFindUnique ?? vi.fn(async () => ({
    id: connectionId,
    provider: 'sandbox'
  }));

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
        id: campaignId,
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
    callAttempt: {
      findMany: callAttemptFindMany,
      update: callAttemptUpdate
    },
    telephonyConnection: {
      findUnique: telephonyConnectionFindUnique
    },
    auditLog: {
      create: auditCreate
    }
  };
};

describe('PATCH campaign status stopMode (OP-T-002b / OP-T-012)', () => {
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

  it('force stop interrupts active sandbox call attempts via hangupCall (OP-T-012)', async () => {
    const sandboxProvider = new SandboxVoiceProvider();
    const started = await sandboxProvider.startCall({
      tenantId,
      campaignId,
      debtorRecordId: 'debtor-1',
      phone: '+79990000000'
    });

    const callAttemptUpdate = vi.fn(async () => ({}));
    const campaignStore = makeRunningStore({
      callAttemptFindMany: vi.fn(async () => ([
        {
          id: 'attempt-ringing',
          providerCallId: started.providerCallId,
          telephonyConnectionId: connectionId,
          status: 'ringing'
        }
      ])),
      callAttemptUpdate
    });

    const app = createApp({
      campaignStore: {
        ...campaignStore,
        voiceProviderResolver: createVoiceProviderResolver({ sandbox: sandboxProvider })
      }
    });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'force' }
    });

    expect(response.statusCode).toBe(200);
    expect(campaignStore.callAttempt.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        campaignId,
        status: { in: ['initiated', 'queued', 'ringing', 'answered'] }
      },
      select: {
        id: true,
        providerCallId: true,
        telephonyConnectionId: true,
        status: true
      }
    });
    expect(callAttemptUpdate).toHaveBeenCalledWith({
      where: { id: 'attempt-ringing' },
      data: expect.objectContaining({
        status: 'completed',
        disconnectInitiator: 'campaign_force_stop',
        endedAt: expect.any(Date)
      })
    });
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          stopMode: 'force',
          forceInterruptsActiveAttempts: true,
          interruptedActiveAttempts: 1,
          complianceBypass: false
        })
      })
    });

    const statusAfterHangup = await sandboxProvider.getCallStatus(started.providerCallId);
    expect(statusAfterHangup.status).toBe('completed');

    await app.close();
  });

  it('graceful stop does not hang up active call attempts (OP-T-012)', async () => {
    const hangupCall = vi.fn(async () => ({
      providerCallId: 'call-1',
      status: 'completed' as const
    }));
    const campaignStore = makeRunningStore({
      callAttemptFindMany: vi.fn(async () => ([
        {
          id: 'attempt-ringing',
          providerCallId: 'call-1',
          telephonyConnectionId: connectionId,
          status: 'ringing'
        }
      ]))
    });

    const app = createApp({
      campaignStore: {
        ...campaignStore,
        voiceProviderResolver: createVoiceProviderResolver({
          sandbox: { hangupCall } as any
        })
      }
    });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'graceful' }
    });

    expect(response.statusCode).toBe(200);
    expect(hangupCall).not.toHaveBeenCalled();
    expect(campaignStore.callAttempt.findMany).not.toHaveBeenCalled();

    await app.close();
  });

  it('force stop skips live providers without local hangup (T-149 deferred)', async () => {
    const hangupCall = vi.fn();
    const campaignStore = makeRunningStore({
      callAttemptFindMany: vi.fn(async () => ([
        {
          id: 'attempt-live',
          providerCallId: 'exolve-call-1',
          telephonyConnectionId: 'conn-exolve',
          status: 'answered'
        }
      ])),
      telephonyConnectionFindUnique: vi.fn(async () => ({
        id: 'conn-exolve',
        provider: 'exolve'
      }))
    });

    const app = createApp({
      campaignStore: {
        ...campaignStore,
        voiceProviderResolver: createVoiceProviderResolver({
          sandbox: { hangupCall } as any,
          exolve: { hangupCall } as any
        })
      }
    });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/status`,
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'force' }
    });

    expect(response.statusCode).toBe(200);
    expect(hangupCall).not.toHaveBeenCalled();
    expect(campaignStore.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          stopMode: 'force',
          interruptedActiveAttempts: 0,
          skippedActiveAttemptsProvider: 1
        })
      })
    });

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
