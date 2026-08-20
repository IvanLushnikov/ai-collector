import { describe, expect, it, vi } from 'vitest';
import { ComplianceEngine } from '../../src/compliance/engine/compliance-engine.js';
import { FrequencyLimitRule } from '../../src/compliance/rules/frequency-limit.js';
import {
  createInMemoryFrequencyLedgerRepository,
  periodStartForBucket,
  recordFrequencyAttempt
} from '../../src/domain/frequency-ledger/index.js';

const context = {
  tenantId: 'tenant-1',
  campaignId: 'campaign-1',
  debtorRecordId: 'debtor-1',
  phone: '+79501234567',
  timezone: 'Etc/UTC',
  debtAmount: 1000,
  debtStatus: 'active',
  consentStatus: 'given',
  creditorKey: 'tenant-1',
  obligationId: 'AB-1001',
  occurredAt: new Date('2026-08-17T10:00:00.000Z')
};

describe('FrequencyLimitRule', () => {
  it('allows when ledger counts are below product caps', async () => {
    const repo = createInMemoryFrequencyLedgerRepository();
    const result = await new FrequencyLimitRule(repo).evaluate(context);

    expect(result).toEqual({ decision: 'allow' });
  });

  it('blocks with FREQUENCY_LIMIT_BLOCK when day count is already 1', async () => {
    const repo = createInMemoryFrequencyLedgerRepository();
    await recordFrequencyAttempt(repo, {
      callAttemptId: 'attempt-1',
      tenantId: context.tenantId,
      creditorKey: context.creditorKey,
      obligationId: context.obligationId,
      status: 'ringing',
      occurredAt: context.occurredAt
    });

    const result = await new FrequencyLimitRule(repo).evaluate(context);

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'FREQUENCY_LIMIT_BLOCK',
      reasonText: 'Достигнут дневной лимит частоты контактов'
    });
    expect(result.reasonText).not.toMatch(/ФЗ-230|FZ-230|230-ФЗ/i);
  });

  it('persists FREQUENCY_LIMIT_BLOCK in the decision log', async () => {
    const repo = createInMemoryFrequencyLedgerRepository();
    await repo.incrementBucket({
      tenantId: context.tenantId,
      creditorKey: context.creditorKey,
      obligationId: context.obligationId,
      bucket: 'day',
      periodStart: periodStartForBucket('day', context.occurredAt)
    });

    const create = vi.fn(async () => ({}));
    const engine = new ComplianceEngine([new FrequencyLimitRule(repo)], {
      complianceDecisionStore: { create }
    });

    const result = await engine.evaluate(context);

    expect(result.decision).toBe('block');
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        decision: 'block',
        reasonCode: 'FREQUENCY_LIMIT_BLOCK'
      })
    });
  });
});
