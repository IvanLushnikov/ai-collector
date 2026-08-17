import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { VoiceCallStatus, VoiceProviderAdapter } from '../../src/telephony/voice-provider/adapter.js';
import { ComplianceEngine } from '../../src/compliance/engine/compliance-engine.js';
import { FakeAllowComplianceRule } from '../../src/compliance/rules/fake-allow.js';
import { ConsentStatusRule } from '../../src/compliance/rules/consent-status.js';
import { DebtStatusRule } from '../../src/compliance/rules/debt-status.js';
import { CallWindowComplianceRule } from '../../src/compliance/rules/call-window.js';

type AppStore = {
  user: {
    findFirst: (query: {
      where: { id?: string; tenantId?: string; isActive?: boolean; status?: string };
    }) => Promise<{ id: string } | null>;
  };
  tenant: {
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  campaign: {
    create: (query: { data: Record<string, unknown> }) => Promise<unknown>;
    findUnique: (query: { where: { id: string } }) => Promise<{ id: string; tenantId: string } | null>;
  };
  debtorRecord: {
    findUnique: (query: { where: { id: string } }) => Promise<{
      id: string;
      tenantId: string;
      campaignId: string;
      phone: string;
      timezone: string;
      debtAmount: number;
      debtStatus: string;
      consentStatus: string;
    } | null>;
  };
  callAttempt: {
    create: (payload: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (query: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
    findMany?: (query: {
      where: {
        tenantId: string;
        campaignId: string;
        callResult?: {
          outcome?: string;
          qaStatus?: string;
        };
      };
      skip?: number;
      take?: number;
      orderBy?: {
        startedAt: 'asc' | 'desc';
      };
    }) => Promise<
      Array<{
        id: string;
        status: string;
        startedAt: string | Date;
        endedAt: string | Date | null;
        debtorRecord: { externalId: string };
        callResult?: { outcome: string; qaStatus?: string } | null;
      }>
    >;
  };
  callResult: {
    create: (payload: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    update: (payload: { where: { id: string }; data: { qaStatus: string } }) => Promise<Record<string, unknown>>;
  };
  usageEvent?: {
    create: (payload: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findMany?: (query: { where: { tenantId: string; campaignId: string; sourceId: { contains: string } } }) => Promise<
      Array<{
        id: string;
        tenantId: string;
        campaignId: string;
        eventType: string;
        quantity: number;
        unit: string;
        sourceId: string;
        occurredAt: string;
      }>
    >;
  };
  complianceDecision?: {
    create: (payload: {
      data: {
        tenantId: string;
        campaignId: string;
        debtorRecordId: string;
        decision: string;
        reasonCode: string;
        reasonText: string;
        ruleVersion: string;
        checkedAt: string | Date;
      };
    }) => Promise<unknown>;
    findMany?: (query: {
      where: {
        tenantId: string;
        campaignId: string;
        debtorRecordId: string;
      };
    }) => Promise<
      Array<{
        id: string;
        tenantId: string;
        campaignId: string;
        debtorRecordId: string;
        decision: string;
        reasonCode: string;
        reasonText: string;
        ruleVersion: string;
        checkedAt: string;
      }>
    >;
  };
  complianceEngine?: ComplianceEngine;
  voiceProvider?: VoiceProviderAdapter;
  auditLog?: {
    create: (payload: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
};

const injectWithOwnerRole = (
  app: ReturnType<typeof createApp>,
  request: Parameters<ReturnType<typeof createApp>['inject']>[0]
) => {
  return app.inject({
    ...request,
    headers: {
      'x-user-role': 'owner',
      ...(request.headers ?? {})
    }
  });
};

describe('POST /tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/calls/sandbox', () => {
  const makeStore = (overrides: Partial<AppStore> = {}): AppStore => ({
    user: {
      findFirst: vi.fn(async () => ({
        id: 'test-user-id'
      }))
    },
    tenant: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === '00000000-0000-0000-0000-000000000000') {
          return null;
        }
        return { id: query.where.id };
      })
    },
    campaign: {
      create: vi.fn(async () => ({})),
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === 'missing-campaign') {
          return null;
        }
        return {
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        };
      })
    },
    debtorRecord: {
      findUnique: vi.fn(async (query: { where: { id: string } }) => {
        if (query.where.id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
          return {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            phone: '+79501234567',
            timezone: 'UTC',
            debtAmount: 1200,
            debtStatus: 'active',
            consentStatus: 'given'
          };
        }

        if (query.where.id === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
          return {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            phone: '+79501234567',
            timezone: 'UTC',
            debtAmount: 1200,
            debtStatus: 'active',
            consentStatus: 'revoked'
          };
        }

        if (query.where.id === 'cccccccc-cccc-cccc-cccc-cccccccccccc') {
          return {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            tenantId: '22222222-2222-2222-2222-222222222222',
            campaignId: '22222222-2222-2222-2222-222222222222',
            phone: '+79995550000',
            timezone: 'UTC',
            debtAmount: 1200,
            debtStatus: 'active',
            consentStatus: 'given'
          };
        }

        return null;
      })
    },
    callAttempt: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'call-attempt-1',
        ...data
      })),
      findUnique: vi.fn(async () => null)
    },
    callResult: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'call-result-1',
        ...data
      })),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: { qaStatus: string } }) => ({
        id: where.id,
        ...data
      }))
    },
    usageEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'usage-event-1',
        ...data
      }))
    },
    complianceDecision: {
      create: vi.fn(async () => ({}))
    },
    ...overrides
  });

  const makeProvider = (options: { initialStatus?: VoiceCallStatus } = {}) => {
    const initialStatus = options.initialStatus ?? 'queued';
    const provider: VoiceProviderAdapter = {
      startCall: vi.fn(async () => ({
        providerCallId: 'provider-call-1',
        status: initialStatus
      })),
      getCallStatus: vi.fn(async () => ({
        providerCallId: 'provider-call-1',
        status: 'queued' as VoiceCallStatus
      })),
      hangupCall: vi.fn(async () => ({
        providerCallId: 'provider-call-1',
        status: 'completed' as VoiceCallStatus
      }))
  };
  return provider;
};

  it('returns 401 when role header is missing', async () => {
    const appStore = makeStore();
    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });

    await app.close();
  });

  it('returns 403 when role is not allowed for sandbox call', async () => {
    const appStore = makeStore({
      complianceEngine: new ComplianceEngine([new FakeAllowComplianceRule()])
    });
    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/calls/sandbox',
      headers: {
        'x-user-role': 'auditor'
      },
      payload: {}
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  describe('GET /tenants/:tenantId/campaigns/:campaignId/calls', () => {
    it('returns 401 when role header is missing', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        }
      });
      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls'
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'USER_ROLE_MISSING',
        message: 'X-User-Role header is required'
      });

      await app.close();
    });

    it('returns 403 when role is not allowed for calls list', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        }
      });
      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls',
        headers: {
          'x-user-role': 'auditor'
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('FORBIDDEN');

      await app.close();
    });

    it('returns calls for campaign sorted by startedAt with debtor externalId and outcome', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        }
      });
      appStore.callAttempt.findMany = vi.fn(async () => [
        {
          id: 'call-1',
          status: 'completed',
          startedAt: '2026-08-16T09:00:00.000Z',
          endedAt: '2026-08-16T09:10:00.000Z',
          debtorRecord: {
            externalId: 'debtor-002'
          },
          callResult: {
            outcome: 'ptp_created'
          }
        },
        {
          id: 'call-2',
          status: 'queued',
          startedAt: '2026-08-16T10:00:00.000Z',
          endedAt: null,
          debtorRecord: {
            externalId: 'debtor-001'
          },
          callResult: null
        }
      ]);

      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        {
          callAttemptId: 'call-1',
          status: 'completed',
          debtorExternalId: 'debtor-002',
          startedAt: '2026-08-16T09:00:00.000Z',
          endedAt: '2026-08-16T09:10:00.000Z',
          outcome: 'ptp_created'
        },
        {
          callAttemptId: 'call-2',
          status: 'queued',
          debtorExternalId: 'debtor-001',
          startedAt: '2026-08-16T10:00:00.000Z',
          endedAt: null,
          outcome: null
        }
      ]);
      expect(appStore.callAttempt.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '22222222-2222-2222-2222-222222222222'
        },
        skip: 0,
        take: 20,
        orderBy: {
          startedAt: 'asc'
        },
        include: {
          debtorRecord: {
            select: {
              externalId: true
            }
          },
          callResult: {
            select: {
              outcome: true,
              qaStatus: true
            }
          }
        }
      });
      await app.close();
    });

    it('uses default pagination for calls list when limit and offset are omitted', async () => {
      const calls = Array.from({ length: 25 }, (_, index) => ({
        id: `call-${index + 1}`,
        status: 'completed',
        startedAt: `2026-08-16T00:${String(index).padStart(2, '0')}:00.000Z`,
        endedAt: null,
        debtorRecord: {
          externalId: `debtor-${index + 1}`
        },
        callResult: null
      }));

      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        },
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-1',
            ...data
          })),
          findUnique: vi.fn(async () => null),
          findMany: vi.fn(async ({ skip = 0, take = 20 }: { where: Record<string, unknown>; skip?: number; take?: number }) => calls.slice(skip, skip + take))
        }
      });

      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls'
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as Array<{ callAttemptId: string }>;
      expect(body).toHaveLength(20);
      expect(body[0].callAttemptId).toBe('call-1');
      expect(body[19].callAttemptId).toBe('call-20');

      expect(appStore.callAttempt.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '22222222-2222-2222-2222-222222222222'
        },
        skip: 0,
        take: 20,
        orderBy: {
          startedAt: 'asc'
        },
        include: {
          debtorRecord: {
            select: {
              externalId: true
            }
          },
          callResult: {
            select: {
              outcome: true,
              qaStatus: true
            }
          }
        }
      });

      await app.close();
    });

    it('filters calls by outcome and qaStatus query params', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        },
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-1',
            ...data
          })),
          findUnique: vi.fn(async () => null),
          findMany: vi.fn(async () => [
            {
              id: 'call-1',
              status: 'completed',
              startedAt: '2026-08-16T09:00:00.000Z',
              endedAt: '2026-08-16T09:10:00.000Z',
              debtorRecord: {
                externalId: 'debtor-007'
              },
              callResult: {
                outcome: 'ptp_created',
                qaStatus: 'approved'
              }
            }
          ])
        }
      });

      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls?outcome=ptp_created&qaStatus=approved'
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        {
          callAttemptId: 'call-1',
          status: 'completed',
          debtorExternalId: 'debtor-007',
          startedAt: '2026-08-16T09:00:00.000Z',
          endedAt: '2026-08-16T09:10:00.000Z',
          outcome: 'ptp_created'
        }
      ]);

      expect(appStore.callAttempt.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '22222222-2222-2222-2222-222222222222',
          callResult: {
            outcome: 'ptp_created',
            qaStatus: 'approved'
          }
        },
        skip: 0,
        take: 20,
        orderBy: {
          startedAt: 'asc'
        },
        include: {
          debtorRecord: {
            select: {
              externalId: true
            }
          },
          callResult: {
            select: {
              outcome: true,
              qaStatus: true
            }
          }
        }
      });

      await app.close();
    });

    it('returns 400 for invalid outcome filter', async () => {
      const app = createApp({
        campaignStore: makeStore()
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls?outcome=invalid'
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('VALIDATION_ERROR');

      await app.close();
    });

    it('returns 400 for invalid qaStatus filter', async () => {
      const app = createApp({
        campaignStore: makeStore()
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls?qaStatus=bad'
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('VALIDATION_ERROR');

      await app.close();
    });

    it('returns 400 when calls limit exceeds max', async () => {
      const app = createApp({
        campaignStore: makeStore()
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls?limit=101'
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('VALIDATION_ERROR');

      await app.close();
    });

    it('returns 400 when calls offset exceeds max', async () => {
      const app = createApp({
        campaignStore: makeStore()
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls?offset=1001'
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('VALIDATION_ERROR');

      await app.close();
    });

    it('returns 404 when campaign belongs to another tenant', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '22222222-2222-2222-2222-222222222222'
          }))
        }
      });

      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'GET',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls'
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: 'CAMPAIGN_NOT_FOUND'
      });

      await app.close();
    });
  });

describe('GET /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId', () => {
  it('returns 401 when role header is missing', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async () => ({})),
        findUnique: vi.fn(async (query: { where: { id: string } }) => ({
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        }))
      }
    });
    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/11111111-1111-1111-1111-111111111111'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });

    await app.close();
  });

  it('returns 403 when role is not allowed for call card', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async () => ({})),
        findUnique: vi.fn(async (query: { where: { id: string } }) => ({
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        }))
      },
      callAttempt: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'call-attempt-1',
          ...data
        })),
        findUnique: vi.fn(async () => null)
      }
    });
    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/11111111-1111-1111-1111-111111111111',
      headers: {
        'x-user-role': 'auditor'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');

    await app.close();
  });

  it('returns call card with attempt, result, compliance decisions and usage events', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async () => ({})),
        findUnique: vi.fn(async (query: { where: { id: string } }) => ({
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        }))
      },
      complianceDecision: {
        create: vi.fn(async () => ({})),
        findMany: vi.fn(async () => [
          {
            id: 'decision-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            decision: 'allow',
            reasonCode: 'ALLOW',
            reasonText: 'Allowed',
            ruleVersion: 'v1',
            checkedAt: '2026-08-16T09:05:00.000Z'
          }
        ])
      },
      usageEvent: {
        create: vi.fn(async () => ({
          id: 'usage-event-1'
        })),
        findMany: vi.fn(async () => [
          {
            id: 'usage-event-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            eventType: 'call_started',
            quantity: 1,
            unit: 'call',
            sourceId: 'sandbox-call:provider-call-1:started',
            occurredAt: '2026-08-16T09:00:00.000Z'
          },
          {
            id: 'usage-event-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            eventType: 'call_completed',
            quantity: 1,
            unit: 'call',
            sourceId: 'sandbox-call:provider-call-1:completed',
            occurredAt: '2026-08-16T09:10:00.000Z'
          }
        ])
      }
    });

    appStore.callAttempt.findUnique = vi.fn(async () => ({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: '11111111-1111-1111-1111-111111111111',
      campaignId: '22222222-2222-2222-2222-222222222222',
      debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      telephonyConnectionId: 'telephony-1',
      status: 'completed',
      providerCallId: 'provider-call-1',
      startedAt: '2026-08-16T09:00:00.000Z',
      endedAt: '2026-08-16T09:10:00.000Z',
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:10:00.000Z',
      debtorRecord: {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        externalId: 'debtor-001'
      },
      callResult: {
        id: 'result-1',
        outcome: 'ptp_created',
        reason: 'sandbox_call_result',
        transcriptUrl: 'sandbox://transcripts/provider-call-1.txt',
        recordingUrl: 'sandbox://recordings/provider-call-1.mp3'
      }
    }));

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/11111111-1111-1111-1111-111111111111'
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      attempt: {
        id: '11111111-1111-1111-1111-111111111111',
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        status: 'completed',
        telephonyConnectionId: 'telephony-1',
        providerCallId: 'provider-call-1',
        startedAt: '2026-08-16T09:00:00.000Z',
        endedAt: '2026-08-16T09:10:00.000Z',
        createdAt: '2026-08-16T09:00:00.000Z',
        updatedAt: '2026-08-16T09:10:00.000Z'
      },
      result: {
        id: 'result-1',
        outcome: 'ptp_created',
        reason: 'sandbox_call_result',
        transcriptUrl: 'sandbox://transcripts/provider-call-1.txt',
        recordingUrl: 'sandbox://recordings/provider-call-1.mp3'
      },
      complianceDecisions: [
        {
          id: 'decision-1',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '22222222-2222-2222-2222-222222222222',
          debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          decision: 'allow',
          reasonCode: 'ALLOW',
          reasonText: 'Allowed',
          ruleVersion: 'v1',
          checkedAt: '2026-08-16T09:05:00.000Z'
        }
      ],
      usageEvents: [
        {
          id: 'usage-event-1',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '22222222-2222-2222-2222-222222222222',
          eventType: 'call_started',
          quantity: 1,
          unit: 'call',
          sourceId: 'sandbox-call:provider-call-1:started',
          occurredAt: '2026-08-16T09:00:00.000Z'
        },
        {
          id: 'usage-event-2',
          tenantId: '11111111-1111-1111-1111-111111111111',
          campaignId: '22222222-2222-2222-2222-222222222222',
          eventType: 'call_completed',
          quantity: 1,
          unit: 'call',
          sourceId: 'sandbox-call:provider-call-1:completed',
          occurredAt: '2026-08-16T09:10:00.000Z'
        }
      ],
      evidenceBundle: {
        callResult: {
          id: 'result-1',
          outcome: 'ptp_created',
          reason: 'sandbox_call_result',
          transcriptUrl: 'sandbox://transcripts/provider-call-1.txt',
          recordingUrl: 'sandbox://recordings/provider-call-1.mp3'
        },
        complianceDecisions: [
          {
            id: 'decision-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            decision: 'allow',
            reasonCode: 'ALLOW',
            reasonText: 'Allowed',
            ruleVersion: 'v1',
            checkedAt: '2026-08-16T09:05:00.000Z'
          }
        ],
        usageEvents: [
          {
            id: 'usage-event-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            eventType: 'call_started',
            quantity: 1,
            unit: 'call',
            sourceId: 'sandbox-call:provider-call-1:started',
            occurredAt: '2026-08-16T09:00:00.000Z'
          },
          {
            id: 'usage-event-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            eventType: 'call_completed',
            quantity: 1,
            unit: 'call',
            sourceId: 'sandbox-call:provider-call-1:completed',
            occurredAt: '2026-08-16T09:10:00.000Z'
          }
        ]
      }
    });

    expect(appStore.callAttempt.findUnique).toHaveBeenCalledWith({
      where: {
          id: '11111111-1111-1111-1111-111111111111'
      },
      include: {
        callResult: true,
        debtorRecord: {
          select: {
            id: true,
            tenantId: true,
            campaignId: true,
            externalId: true
          }
        }
      }
    });

    expect(appStore.complianceDecision?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      }
    });

    expect(appStore.usageEvent?.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        sourceId: {
          contains: 'provider-call-1'
        }
      },
      orderBy: {
        occurredAt: 'asc'
      }
    });

    await app.close();
  });

  it('returns 404 when call is not found', async () => {
    const appStore = makeStore({
      campaign: {
        create: vi.fn(async () => ({})),
        findUnique: vi.fn(async (query: { where: { id: string } }) => ({
          id: query.where.id,
          tenantId: '11111111-1111-1111-1111-111111111111'
        }))
      }
    });
    appStore.callAttempt.findUnique = vi.fn(async () => null);

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'GET',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/22222222-2222-2222-2222-222222222223'
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CALL_ATTEMPT_NOT_FOUND'
    });

    await app.close();
  });

  describe('PATCH /tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa', () => {
    it('returns 401 when role header is missing', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        }
      });

      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await app.inject({
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/qa',
        payload: {
          qaStatus: 'approved'
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'USER_ROLE_MISSING',
        message: 'X-User-Role header is required'
      });

      await app.close();
    });

    it('returns 403 when role is not allowed for qa update', async () => {
      const appStore = makeStore({
        campaign: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async (query: { where: { id: string } }) => ({
            id: query.where.id,
            tenantId: '11111111-1111-1111-1111-111111111111'
          }))
        },
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-qa-forbidden',
            ...data
          })),
          findUnique: vi.fn(async () => ({
            id: 'call-attempt-qa-forbidden',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            callResult: {
              id: 'call-result-qa-forbidden',
              qaStatus: 'not_reviewed'
            },
            debtorRecord: {
              tenantId: '11111111-1111-1111-1111-111111111111',
              campaignId: '22222222-2222-2222-2222-222222222222'
            }
          }))
        }
      });

      const app = createApp({
        campaignStore: appStore
      });
      await app.ready();

      const response = await app.inject({
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/qa',
        headers: {
          'x-user-role': 'operator'
        },
        payload: {
          qaStatus: 'approved'
        }
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error).toBe('FORBIDDEN');

      await app.close();
    });

    it('allows qa_analyst to update qa status', async () => {
      const store = makeStore({
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-qa-1',
            ...data
          })),
          findUnique: vi.fn(async () => ({
            id: 'call-attempt-qa-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            callResult: {
              id: 'call-result-qa-1',
              qaStatus: 'not_reviewed'
            },
            debtorRecord: {
              tenantId: '11111111-1111-1111-1111-111111111111',
              campaignId: '22222222-2222-2222-2222-222222222222'
            }
          }))
        },
        auditLog: {
          create: vi.fn(async () => ({}))
        }
      });

      const app = createApp({
        campaignStore: store
      });
      await app.ready();

      const response = await app.inject({
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/qa',
        headers: {
          'x-user-role': 'qa_analyst'
        },
        payload: {
          qaStatus: 'approved'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        id: 'call-result-qa-1',
        qaStatus: 'approved'
      });

      await app.close();
    });

    it('updates qaStatus and writes audit event', async () => {
      const store = makeStore({
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-qa-1',
            ...data
          })),
          findUnique: vi.fn(async () => ({
            id: 'call-attempt-qa-1',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            callResult: {
              id: 'call-result-qa-1',
              qaStatus: 'not_reviewed'
            },
            debtorRecord: {
              tenantId: '11111111-1111-1111-1111-111111111111',
              campaignId: '22222222-2222-2222-2222-222222222222'
            }
          }))
        },
        auditLog: {
          create: vi.fn(async () => ({}))
        }
      });

      const app = createApp({
        campaignStore: store
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/qa',
        payload: {
          qaStatus: 'approved'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        id: 'call-result-qa-1',
        qaStatus: 'approved'
      });

      expect(store.callResult.update).toHaveBeenCalledWith({
        where: {
          id: 'call-result-qa-1'
        },
        data: {
          qaStatus: 'approved'
        }
      });

      expect(store.auditLog?.create).toHaveBeenCalledWith({
        data: {
          tenantId: '11111111-1111-1111-1111-111111111111',
          userId: 'test-user-id',
          action: 'call.qa_updated',
          entityType: 'callResult',
          entityId: 'call-result-qa-1',
          metadata: {
            callAttemptId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            campaignId: '22222222-2222-2222-2222-222222222222',
            qaStatus: 'approved',
            previousQaStatus: 'not_reviewed'
          }
        }
      });

      await app.close();
    });

    it('returns 400 for unknown qaStatus', async () => {
      const store = makeStore();

      const app = createApp({
        campaignStore: store
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/qa',
        payload: {
          qaStatus: 'unknown'
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: 'VALIDATION_ERROR'
        })
      );

      await app.close();
    });

    it('returns 404 when qa result is missing for call attempt', async () => {
      const store = makeStore({
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-qa-2',
            ...data
          })),
          findUnique: vi.fn(async () => ({
            id: 'call-attempt-qa-2',
            tenantId: '11111111-1111-1111-1111-111111111111',
            campaignId: '22222222-2222-2222-2222-222222222222',
            callResult: null,
            debtorRecord: {
              tenantId: '11111111-1111-1111-1111-111111111111',
              campaignId: '22222222-2222-2222-2222-222222222222'
            }
          }))
        }
      });

      const app = createApp({
        campaignStore: store
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab/qa',
        payload: {
          qaStatus: 'flagged'
        }
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: 'CALL_ATTEMPT_NOT_FOUND'
      });

      await app.close();
    });

    it('returns 404 when call attempt belongs to another tenant', async () => {
      const store = makeStore({
        callAttempt: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'call-attempt-qa-3',
            ...data
          })),
          findUnique: vi.fn(async () => ({
            id: 'call-attempt-qa-3',
            tenantId: '22222222-2222-2222-2222-222222222222',
            campaignId: '22222222-2222-2222-2222-222222222222',
            callResult: {
              id: 'call-result-qa-3',
              qaStatus: 'not_reviewed'
            },
            debtorRecord: {
              tenantId: '22222222-2222-2222-2222-222222222222',
              campaignId: '22222222-2222-2222-2222-222222222222'
            }
          }))
        }
      });

      const app = createApp({
        campaignStore: store
      });
      await app.ready();

      const response = await injectWithOwnerRole(app, {
        method: 'PATCH',
        url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/calls/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac/qa',
        payload: {
          qaStatus: 'approved'
        }
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: 'CALL_ATTEMPT_NOT_FOUND'
      });

      await app.close();
    });
  });
});

  it('starts sandbox call after compliance allow and creates CallAttempt', async () => {
    const provider = makeProvider();
    const store = makeStore({
      complianceEngine: new ComplianceEngine([new FakeAllowComplianceRule()]),
      voiceProvider: provider
    });

    const app = createApp({
      campaignStore: store
    });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.allowed).toBe(true);
    expect(body.decision).toBe('allow');
    expect(body.callAttempt.providerCallId).toBe('provider-call-1');

    expect(provider.startCall).toHaveBeenCalledOnce();
    expect(store.callAttempt.create).toHaveBeenCalledOnce();
    expect(store.callResult.create).toHaveBeenCalledOnce();
    expect(store.callResult.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        callAttemptId: 'call-attempt-1',
        outcome: 'not_called',
        qaStatus: 'not_reviewed',
        reason: 'sandbox_call_result',
        transcriptUrl: 'sandbox://transcripts/provider-call-1.txt',
        recordingUrl: 'sandbox://recordings/provider-call-1.mp3'
      }
    });
    expect(store.usageEvent?.create).toHaveBeenCalledTimes(1);
    expect(store.usageEvent?.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        eventType: 'call_started',
        quantity: 1,
        unit: 'call',
        sourceId: 'sandbox-call:provider-call-1:started',
        occurredAt: expect.any(Date)
      }
    });

    await app.close();
  });

  it('creates call_completed usage event for terminal sandbox call status', async () => {
    const provider = makeProvider({ initialStatus: 'completed' });
    const store = makeStore({
      complianceEngine: new ComplianceEngine([new FakeAllowComplianceRule()]),
      voiceProvider: provider
    });

    const app = createApp({
      campaignStore: store
    });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(201);
    expect(store.callResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        outcome: 'ptp_created',
        qaStatus: 'not_reviewed'
      })
    });
    expect(store.usageEvent?.create).toHaveBeenCalledTimes(2);
    expect(store.usageEvent?.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        campaignId: '22222222-2222-2222-2222-222222222222',
        eventType: 'call_completed',
        quantity: 1,
        unit: 'call',
        sourceId: 'sandbox-call:provider-call-1:completed',
        occurredAt: expect.any(Date)
      }
    });

    await app.close();
  });

  it('creates audit trail when sandbox call is successfully started', async () => {
    const provider = makeProvider();
    const store = makeStore({
      complianceEngine: new ComplianceEngine([new FakeAllowComplianceRule()]),
      voiceProvider: provider,
      auditLog: {
        create: vi.fn(async () => ({}))
      }
    });

    const app = createApp({
      campaignStore: store
    });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(201);
    expect(store.auditLog?.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'test-user-id',
        action: 'call.sandbox_started',
        entityType: 'callAttempt',
        entityId: 'call-attempt-1',
        metadata: {
          debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          campaignId: '22222222-2222-2222-2222-222222222222',
          callAttemptId: 'call-attempt-1',
          providerCallId: 'provider-call-1',
          callStatus: 'queued',
          decision: 'allow'
        }
      }
    });

    await app.close();
  });

  it('returns 403 and does not start call when compliance blocks', async () => {
    const provider = makeProvider();
    const store = makeStore({
      complianceEngine: new ComplianceEngine([
        new CallWindowComplianceRule(),
        new DebtStatusRule(),
        {
          name: 'always-block',
          evaluate: async () => ({
            decision: 'block',
            reasonCode: 'CUSTOM_BLOCK',
            reasonText: 'Policy blocked'
          })
        },
        new ConsentStatusRule()
      ]),
      voiceProvider: provider
    });

    const app = createApp({ campaignStore: store });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.allowed).toBe(false);
    expect(body.decision).toBe('block');
    expect(provider.startCall).not.toHaveBeenCalled();
    expect(store.callAttempt.create).not.toHaveBeenCalled();

    await app.close();
  });

  it('creates audit trail when sandbox call is blocked by compliance', async () => {
    const provider = makeProvider();
    const store = makeStore({
      complianceEngine: new ComplianceEngine([
        new CallWindowComplianceRule(),
        new DebtStatusRule(),
        {
          name: 'always-block',
          evaluate: async () => ({
            decision: 'block',
            reasonCode: 'CUSTOM_BLOCK',
            reasonText: 'Policy blocked'
          })
        },
        new ConsentStatusRule()
      ]),
      voiceProvider: provider,
      auditLog: {
        create: vi.fn(async () => ({}))
      }
    });

    const app = createApp({ campaignStore: store });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(403);
    expect(store.auditLog?.create).toHaveBeenCalledWith({
      data: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        userId: 'test-user-id',
        action: 'call.sandbox_blocked',
        entityType: 'debtorRecord',
        entityId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        metadata: {
          debtorRecordId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          campaignId: '22222222-2222-2222-2222-222222222222',
          callOutcome: 'blocked',
          reasons: expect.arrayContaining([
            expect.objectContaining({
              decision: 'block',
              reasonCode: 'CUSTOM_BLOCK',
              reasonText: 'Policy blocked'
            }),
            expect.objectContaining({
              decision: 'block',
              reasonCode: 'CONSENT_REVOKED',
              reasonText: 'Consent status is revoked'
            })
          ]),
          rules: expect.arrayContaining([
            'call-window',
            'debt-status',
            'always-block',
            'consent-status'
          ])
        }
      }
    });

    await app.close();
  });

  it('returns 422 when active tenant actor is missing', async () => {
    const appStore = makeStore({
      user: {
        findFirst: vi.fn(async () => null)
      },
      complianceEngine: new ComplianceEngine([new FakeAllowComplianceRule()])
    });

    const app = createApp({
      campaignStore: appStore
    });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({
      error: 'NO_ACTIVE_USER_FOR_TENANT'
    });

    await app.close();
  });

  it('returns 404 when debtor is outside tenant scope', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store });
    await app.ready();

    const response = await injectWithOwnerRole(app, {
      method: 'POST',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/22222222-2222-2222-2222-222222222222/debtors/cccccccc-cccc-cccc-cccc-cccccccccccc/calls/sandbox',
      payload: {}
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'DEBTOR_RECORD_NOT_FOUND' });

    await app.close();
  });
});
