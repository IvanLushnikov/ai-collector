import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { ComplianceEngine } from '../../src/compliance/engine/compliance-engine.js';
import { createSandboxApiComplianceEngine } from '../helpers/sandbox-compliance-engine.js';
import { ConsentStatusRule } from '../../src/compliance/rules/consent-status.js';
import { DebtStatusRule } from '../../src/compliance/rules/debt-status.js';
import { CallWindowComplianceRule } from '../../src/compliance/rules/call-window.js';

const tenantId = '11111111-1111-1111-1111-111111111111';
const campaignId = '22222222-2222-2222-2222-222222222222';
const debtorId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const liveUrl = `/tenants/${tenantId}/campaigns/${campaignId}/debtors/${debtorId}/calls/live`;

const makeStore = (overrides: Record<string, unknown> = {}) => ({
  liveCallsEnabled: true,
  user: {
    findFirst: vi.fn(async () => ({ id: 'test-user-id' }))
  },
  tenant: {
    findUnique: vi.fn(async (query: { where: { id: string } }) => (
      query.where.id === tenantId ? { id: tenantId, legalBasisStatus: 'confirmed' } : null
    ))
  },
  campaign: {
    create: vi.fn(async () => ({})),
    findUnique: vi.fn(async () => ({
      id: campaignId,
      tenantId,
      status: 'ready',
      telephonyConnectionId: 'telephony-1',
      updatedAt: '2026-08-16T12:00:00.000Z'
    }))
  },
  debtorRecord: {
    findUnique: vi.fn(async () => ({
      id: debtorId,
      tenantId,
      campaignId,
      phone: '+79501234567',
      timezone: 'UTC',
      debtAmount: 1200,
      debtStatus: 'active',
      consentStatus: 'given'
    })),
    count: vi.fn(async () => 5)
  },
  scriptVersion: {
    findMany: vi.fn(async () => [{ status: 'active', updatedAt: '2026-08-16T11:00:00.000Z' }]),
    findFirst: vi.fn(async () => ({ id: 'script-1', status: 'active', version: 1 }))
  },
  telephonyConnection: {
    findUnique: vi.fn(async () => ({
      id: 'telephony-1',
      tenantId,
      provider: 'sandbox',
      mode: 'sandbox',
      status: 'active',
      lastProbeAt: '2026-08-16T10:00:00.000Z',
      probeMarking: true,
      probeRecording: true,
      probeHandoff: true,
      updatedAt: '2026-08-16T10:00:00.000Z'
    }))
  },
  callAttempt: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'call-attempt-1', ...data })),
    findUnique: vi.fn(async () => null),
    findMany: vi.fn(async () => [])
  },
  callResult: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'call-result-1', ...data })),
    update: vi.fn(async () => ({}))
  },
  usageEvent: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'usage-event-1', ...data }))
  },
  complianceDecision: {
    create: vi.fn(async () => ({})),
    count: vi.fn(async () => 0)
  },
  auditLog: {
    create: vi.fn(async () => ({}))
  },
  complianceEngine: createSandboxApiComplianceEngine(),
  ...overrides
});

const injectOwner = (app: any, request: any) => app.inject({
  ...request,
  headers: {
    'x-user-role': 'owner',
    'idempotency-key': 'live-test-request-1',
    ...((request?.headers as Record<string, unknown> | undefined) ?? {})
  }
});

describe('POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/live', () => {
  it('returns LIVE_CALLS_DISABLED when the flag is off and does not create a CallAttempt', async () => {
    const campaignStore = makeStore({ liveCallsEnabled: false });
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectOwner(app, { method: 'POST', url: liveUrl, payload: {} });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('LIVE_CALLS_DISABLED');
    expect(campaignStore.callAttempt.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('does not proxy a live request to sandbox when the feature flag is on', async () => {
    const campaignStore = makeStore();
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectOwner(app, { method: 'POST', url: liveUrl, payload: {} });

    expect(response.statusCode).toBe(501);
    expect(response.json().error).toBe('LIVE_CALLS_NOT_IMPLEMENTED');
    expect(campaignStore.callAttempt.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('does not inspect tenant data through the unimplemented live route', async () => {
    const campaignStore = makeStore({
      debtorRecord: {
        findUnique: vi.fn(async () => ({
          id: debtorId,
          tenantId: '00000000-0000-0000-0000-000000000099',
          campaignId,
          phone: '+79501234567',
          timezone: 'UTC',
          debtAmount: 1200,
          debtStatus: 'active',
          consentStatus: 'given'
        })),
        count: vi.fn(async () => 5)
      }
    });
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectOwner(app, { method: 'POST', url: liveUrl, payload: {} });

    expect(response.statusCode).toBe(501);
    expect(response.json().error).toBe('LIVE_CALLS_NOT_IMPLEMENTED');
    expect(campaignStore.callAttempt.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('does not evaluate compliance through the unimplemented live route', async () => {
    const campaignStore = makeStore({
      debtorRecord: {
        findUnique: vi.fn(async () => ({
          id: debtorId,
          tenantId,
          campaignId,
          phone: '+79501234567',
          timezone: 'UTC',
          debtAmount: 1200,
          debtStatus: 'active',
          consentStatus: 'revoked'
        })),
        count: vi.fn(async () => 5)
      },
      complianceEngine: new ComplianceEngine([
        new ConsentStatusRule(),
        new CallWindowComplianceRule(),
        new DebtStatusRule()
      ])
    });
    const app = createApp({ campaignStore });
    await app.ready();

    const response = await injectOwner(app, { method: 'POST', url: liveUrl, payload: {} });

    expect(response.statusCode).toBe(501);
    expect(response.json().error).toBe('LIVE_CALLS_NOT_IMPLEMENTED');
    expect(campaignStore.callAttempt.create).not.toHaveBeenCalled();
    await app.close();
  });
});
