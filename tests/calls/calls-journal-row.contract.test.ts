import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

const tenantId = '11111111-1111-1111-1111-111111111111';
const campaignId = '22222222-2222-2222-2222-222222222222';
const detailAttemptId = '33333333-3333-3333-3333-333333333333';

describe('calls journal row contract (OP-T-004)', () => {
  it('list rows expose dialStatus, outcome and complianceDecision for three UI columns', async () => {
    const findComplianceDecisions = vi.fn(async () => [
      {
        debtorRecordId: 'debtor-allow',
        decision: 'allow',
        reasonCode: 'ALLOW',
        reasonText: 'Согласие подтверждено',
        checkedAt: '2026-08-19T10:00:00.000Z'
      },
      {
        debtorRecordId: 'debtor-block',
        decision: 'block',
        reasonCode: 'OUTSIDE_WINDOW',
        reasonText: 'Вне разрешённого окна звонка',
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
              status: 'completed',
              dialStatus: 'completed',
              startedAt: '2026-08-19T08:00:00.000Z',
              endedAt: '2026-08-19T08:05:00.000Z',
              debtorRecord: { externalId: 'ext-allow' },
              callResult: { outcome: 'ptp_created', qaStatus: 'not_reviewed' }
            },
            {
              id: 'attempt-block',
              debtorRecordId: 'debtor-block',
              status: 'blocked',
              dialStatus: 'blocked',
              startedAt: '2026-08-19T08:01:00.000Z',
              endedAt: null,
              debtorRecord: { externalId: 'ext-block' },
              callResult: { outcome: 'blocked', qaStatus: 'not_reviewed' }
            },
            {
              id: 'attempt-unchecked',
              debtorRecordId: 'debtor-unchecked',
              status: 'queued',
              dialStatus: 'queued',
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
    const rows = response.json();
    expect(rows).toEqual([
      expect.objectContaining({
        callAttemptId: 'attempt-allow',
        dialStatus: 'completed',
        outcome: 'ptp_created',
        complianceStatus: 'allowed',
        complianceDecision: {
          decision: 'allow',
          reasonCode: 'ALLOW',
          reasonText: 'Согласие подтверждено',
          checkedAt: '2026-08-19T10:00:00.000Z',
          blockKind: null
        }
      }),
      expect.objectContaining({
        callAttemptId: 'attempt-block',
        dialStatus: 'blocked',
        outcome: 'blocked',
        complianceStatus: 'blocked',
        complianceDecision: {
          decision: 'block',
          reasonCode: 'OUTSIDE_WINDOW',
          reasonText: 'Вне разрешённого окна звонка',
          checkedAt: '2026-08-19T09:00:00.000Z',
          blockKind: null
        }
      }),
      expect.objectContaining({
        callAttemptId: 'attempt-unchecked',
        dialStatus: 'queued',
        outcome: null,
        complianceStatus: 'not_checked',
        complianceDecision: null
      })
    ]);

    expect(findComplianceDecisions).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          debtorRecordId: true,
          decision: true,
          reasonCode: true,
          reasonText: true,
          checkedAt: true
        })
      })
    );

    await app.close();
  });

  it('detail exposes the same complianceDecision summary for the journal hierarchy', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        callAttempt: {
          create: vi.fn(async () => ({})),
          findUnique: vi.fn(async () => ({
            id: detailAttemptId,
            tenantId,
            campaignId,
            debtorRecordId: 'debtor-1',
            status: 'completed',
            dialStatus: 'completed',
            reviewRequired: false,
            telephonyConnectionId: 'tel-1',
            scriptVersionId: null,
            providerCallId: 'prov-1',
            providerStatusRaw: null,
            identityVerified: false,
            identityVerifiedAt: null,
            startedAt: '2026-08-19T08:00:00.000Z',
            endedAt: '2026-08-19T08:05:00.000Z',
            createdAt: '2026-08-19T08:00:00.000Z',
            updatedAt: '2026-08-19T08:05:00.000Z',
            callResult: {
              id: 'result-1',
              outcome: 'handoff',
              qaStatus: 'not_reviewed',
              conversationStatus: null,
              transcriptStatus: null,
              recordingStatus: null
            },
            debtorRecord: {
              id: 'debtor-1',
              tenantId,
              campaignId,
              externalId: 'ext-1'
            }
          })),
          findMany: vi.fn(async () => [])
        },
        callResult: { create: vi.fn(async () => ({})) },
        complianceDecision: {
          findMany: vi.fn(async () => [
            {
              id: 'dec-old',
              decision: 'allow',
              reasonCode: 'ALLOW',
              reasonText: 'Старое решение',
              checkedAt: '2026-08-19T07:00:00.000Z'
            },
            {
              id: 'dec-new',
              decision: 'block',
              reasonCode: 'CONSENT_LOW',
              reasonText: 'Согласие не подтверждено',
              checkedAt: '2026-08-19T09:00:00.000Z'
            }
          ])
        },
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
      url: `/tenants/${tenantId}/campaigns/${campaignId}/calls/${detailAttemptId}`,
      headers: { 'x-user-role': 'owner' }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.attempt.dialStatus).toBe('completed');
    expect(body.result.outcome).toBe('handoff');
    expect(body.complianceDecision).toEqual({
      decision: 'block',
      reasonCode: 'CONSENT_LOW',
      reasonText: 'Согласие не подтверждено',
      checkedAt: '2026-08-19T09:00:00.000Z',
      blockKind: null
    });
    expect(Array.isArray(body.complianceDecisions)).toBe(true);
    expect(body.complianceDecisions).toHaveLength(2);

    await app.close();
  });
});
