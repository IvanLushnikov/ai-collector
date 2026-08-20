import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

const tenantId = '11111111-1111-1111-1111-111111111111';
const campaignId = '22222222-2222-2222-2222-222222222222';
const callAttemptId = '33333333-3333-3333-3333-333333333333';
const url = `/tenants/${tenantId}/campaigns/${campaignId}/calls/${callAttemptId}`;

describe('GET call attempt detail', () => {
  it('returns separated technical, evidence and business layers', async () => {
    const startedAt = new Date('2026-08-19T08:00:00.000Z');
    const endedAt = new Date('2026-08-19T08:05:00.000Z');
    const receivedAt = new Date('2026-08-19T08:05:01.000Z');
    const callEvents = [{
      normalizedStatus: 'completed',
      rawStatus: 'completed',
      eventSource: 'webhook',
      receivedAt
    }];
    const transcript = { id: 'tr-1', status: 'processing' };
    const recording = { id: 'rec-1', status: 'ready' };
    const reconciliationIssues = [{ id: 'issue-1', kind: 'status_mismatch', severity: 'warning' }];

    const assertTenantScoped = (args: { where: { tenantId?: string; callAttemptId?: string } }) => {
      expect(args.where).toMatchObject({ tenantId, callAttemptId });
    };

    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        callAttempt: {
          create: vi.fn(async () => ({})),
          findMany: vi.fn(async () => []),
          findUnique: vi.fn(async () => ({
            id: callAttemptId,
            tenantId,
            campaignId,
            debtorRecordId: 'debtor-1',
            telephonyConnectionId: 'conn-1',
            status: 'completed',
            dialStatus: 'completed',
            providerCallId: 'provider-1',
            startedAt,
            endedAt,
            createdAt: startedAt,
            updatedAt: endedAt,
            debtorRecord: { id: 'debtor-1', tenantId, campaignId, externalId: 'ext-1' },
            callResult: {
              id: 'result-1',
              outcome: 'ptp_created',
              qaStatus: 'not_reviewed',
              conversationStatus: 'awaiting_transcription',
              transcriptStatus: 'processing',
              recordingStatus: 'ready'
            }
          }))
        },
        callResult: {
          create: vi.fn(async () => ({})),
          update: vi.fn(async () => ({}))
        },
        complianceDecision: { findMany: vi.fn(async () => []) },
        usageEvent: { findMany: vi.fn(async () => []) },
        callEvent: {
          findMany: vi.fn(async (args) => {
            assertTenantScoped(args);
            return callEvents;
          })
        },
        callTranscript: {
          findFirst: vi.fn(async (args) => {
            assertTenantScoped(args);
            return transcript;
          })
        },
        callRecordingAsset: {
          findFirst: vi.fn(async (args) => {
            assertTenantScoped(args);
            return recording;
          })
        },
        callReconciliationIssue: {
          findMany: vi.fn(async (args) => {
            assertTenantScoped(args);
            return reconciliationIssues;
          })
        }
      } as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url,
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().attempt.dialStatus).toBe('completed');
    expect(response.json().result.conversationStatus).toBe('awaiting_transcription');
    expect(response.json().providerStatus).toEqual({
      normalized: 'completed',
      raw: 'completed',
      source: 'webhook',
      receivedAt: receivedAt.toISOString()
    });
    const serializedCallEvents = [{
      ...callEvents[0],
      receivedAt: receivedAt.toISOString()
    }];
    expect(response.json()).toMatchObject({
      callEvents: serializedCallEvents,
      transcript,
      recording,
      reconciliationIssues,
      evidenceBundle: {
        callEvents: serializedCallEvents,
        transcript,
        recording,
        reconciliationIssues
      }
    });
    await app.close();
  });

  it('marks connected calls with absent evidence for review', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        callAttempt: {
          create: vi.fn(async () => ({})),
          findMany: vi.fn(async () => []),
          findUnique: vi.fn(async () => ({
            id: callAttemptId,
            tenantId,
            campaignId,
            debtorRecordId: 'debtor-1',
            telephonyConnectionId: 'conn-1',
            status: 'completed',
            dialStatus: 'completed',
            providerCallId: 'provider-1',
            startedAt: '2026-08-19T08:00:00.000Z',
            endedAt: '2026-08-19T08:05:00.000Z',
            createdAt: '2026-08-19T08:00:00.000Z',
            updatedAt: '2026-08-19T08:05:00.000Z',
            debtorRecord: { id: 'debtor-1', tenantId, campaignId, externalId: 'ext-1' },
            callResult: null
          }))
        },
        callResult: { create: vi.fn(async () => ({})) },
        complianceDecision: { findMany: vi.fn(async () => []) },
        usageEvent: { findMany: vi.fn(async () => []) },
        callEvent: { findMany: vi.fn(async () => []) },
        callTranscript: { findFirst: vi.fn(async () => null) },
        callRecordingAsset: { findFirst: vi.fn(async () => null) },
        callReconciliationIssue: { findMany: vi.fn(async () => []) }
      } as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url,
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      attempt: {
        dialStatus: 'completed',
        reviewRequired: true
      },
      result: {
        conversationStatus: 'review_required',
        recordingStatus: 'missing',
        transcriptStatus: 'failed'
      }
    });
    await app.close();
  });
});

describe('GET calls list', () => {
  it('adds lifecycle fields without removing legacy fields', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        callAttempt: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async () => null),
          findMany: vi.fn(async () => [{
            id: callAttemptId,
            status: 'completed',
            dialStatus: null,
            reviewRequired: false,
            startedAt: '2026-08-19T08:00:00.000Z',
            endedAt: '2026-08-19T08:05:00.000Z',
            debtorRecord: { externalId: 'ext-1' },
            callResult: {
              outcome: 'ptp_created',
              qaStatus: 'not_reviewed',
              conversationStatus: null,
              transcriptStatus: 'processing',
              recordingStatus: 'ready'
            }
          }])
        },
        callResult: {
          create: vi.fn(async () => ({})),
          update: vi.fn(async () => ({}))
        }
      } as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/calls`,
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{
      callAttemptId,
      status: 'completed',
      dialStatus: 'completed',
      conversationStatus: 'awaiting_transcription',
      outcome: 'ptp_created',
      complianceStatus: 'not_checked',
      complianceDecision: null,
      recordingStatus: 'ready',
      transcriptStatus: 'processing',
      reviewRequired: false,
      debtorExternalId: 'ext-1',
      startedAt: '2026-08-19T08:00:00.000Z',
      endedAt: '2026-08-19T08:05:00.000Z'
    }]);
    await app.close();
  });

  it('marks only connected rows with absent evidence for review', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        callAttempt: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async () => null),
          findMany: vi.fn(async () => [
            {
              id: 'connected-attempt',
              debtorRecordId: 'debtor-1',
              status: 'completed',
              dialStatus: 'completed',
              startedAt: '2026-08-19T08:00:00.000Z',
              endedAt: '2026-08-19T08:05:00.000Z',
              debtorRecord: { externalId: 'ext-1' },
              callResult: null
            },
            {
              id: 'unanswered-attempt',
              debtorRecordId: 'debtor-2',
              status: 'no_answer',
              dialStatus: 'no_answer',
              startedAt: '2026-08-19T09:00:00.000Z',
              endedAt: '2026-08-19T09:01:00.000Z',
              debtorRecord: { externalId: 'ext-2' },
              callResult: null
            },
            {
              id: 'awaiting-transcript-attempt',
              debtorRecordId: 'debtor-3',
              status: 'completed',
              dialStatus: 'completed',
              startedAt: '2026-08-19T10:00:00.000Z',
              endedAt: '2026-08-19T10:05:00.000Z',
              debtorRecord: { externalId: 'ext-3' },
              callResult: {
                conversationStatus: 'finalized',
                recordingStatus: 'ready',
                transcriptStatus: null
              }
            }
          ])
        },
        callResult: { create: vi.fn(async () => ({})) },
        complianceDecision: { findMany: vi.fn(async () => []) }
      } as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/calls`,
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({
        callAttemptId: 'connected-attempt',
        conversationStatus: 'review_required',
        recordingStatus: 'missing',
        transcriptStatus: 'failed',
        reviewRequired: true
      }),
      expect.objectContaining({
        callAttemptId: 'unanswered-attempt',
        conversationStatus: null,
        recordingStatus: null,
        transcriptStatus: null,
        reviewRequired: false
      }),
      expect.objectContaining({
        callAttemptId: 'awaiting-transcript-attempt',
        conversationStatus: 'awaiting_transcription',
        recordingStatus: 'ready',
        transcriptStatus: 'pending',
        reviewRequired: false
      })
    ]);
    await app.close();
  });

  it('maps the latest compliance decision for each debtor in one batch', async () => {
    const findComplianceDecisions = vi.fn(async () => [
      {
        debtorRecordId: 'debtor-allow',
        decision: 'allow',
        checkedAt: '2026-08-19T10:00:00.000Z'
      },
      {
        debtorRecordId: 'debtor-block',
        decision: 'block',
        checkedAt: '2026-08-19T09:00:00.000Z'
      }
    ]);
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        callAttempt: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async () => null),
          findMany: vi.fn(async () => [
            {
              id: 'attempt-allow',
              debtorRecordId: 'debtor-allow',
              status: 'queued',
              startedAt: '2026-08-19T08:00:00.000Z',
              endedAt: null,
              debtorRecord: { externalId: 'ext-allow' },
              callResult: null
            },
            {
              id: 'attempt-block',
              debtorRecordId: 'debtor-block',
              status: 'queued',
              startedAt: '2026-08-19T08:01:00.000Z',
              endedAt: null,
              debtorRecord: { externalId: 'ext-block' },
              callResult: null
            },
            {
              id: 'attempt-unchecked',
              debtorRecordId: 'debtor-unchecked',
              status: 'queued',
              startedAt: '2026-08-19T08:02:00.000Z',
              endedAt: null,
              debtorRecord: { externalId: 'ext-unchecked' },
              callResult: null
            }
          ])
        },
        callResult: { create: vi.fn(async () => ({})) },
        complianceDecision: { findMany: findComplianceDecisions }
      } as any
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/calls`,
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().map((row: { complianceStatus: string }) => row.complianceStatus)).toEqual([
      'allowed',
      'blocked',
      'not_checked'
    ]);
    expect(findComplianceDecisions).toHaveBeenCalledOnce();
    expect(findComplianceDecisions).toHaveBeenCalledWith({
      where: {
        tenantId,
        debtorRecordId: {
          in: ['debtor-allow', 'debtor-block', 'debtor-unchecked']
        }
      },
      orderBy: {
        checkedAt: 'desc'
      },
      select: {
        debtorRecordId: true,
        decision: true,
        reasonCode: true,
        reasonText: true,
        checkedAt: true
      }
    });
    await app.close();
  });
});
