import { describe, expect, it } from 'vitest';
import {
  createInMemoryFrequencyLedgerRepository,
  periodStartForBucket,
  recordFrequencyAttempt,
  shouldRecordFrequencyAttempt
} from '../../src/domain/frequency-ledger/index.js';

const baseInput = {
  callAttemptId: 'attempt-1',
  tenantId: 'tenant-1',
  creditorKey: 'tenant-1',
  obligationId: 'AB-1001',
  occurredAt: new Date('2026-08-17T10:00:00.000Z')
};

describe('recordFrequencyAttempt', () => {
  it('increments day, week and month buckets on ringing', async () => {
    const repo = createInMemoryFrequencyLedgerRepository();

    const result = await recordFrequencyAttempt(repo, {
      ...baseInput,
      status: 'ringing'
    });

    expect(result).toBe('counted');
    expect(await repo.getCount({
      tenantId: 'tenant-1',
      creditorKey: 'tenant-1',
      obligationId: 'AB-1001',
      bucket: 'day',
      periodStart: periodStartForBucket('day', baseInput.occurredAt)
    })).toBe(1);
    expect(await repo.getCount({
      tenantId: 'tenant-1',
      creditorKey: 'tenant-1',
      obligationId: 'AB-1001',
      bucket: 'week',
      periodStart: periodStartForBucket('week', baseInput.occurredAt)
    })).toBe(1);
    expect(await repo.getCount({
      tenantId: 'tenant-1',
      creditorKey: 'tenant-1',
      obligationId: 'AB-1001',
      bucket: 'month',
      periodStart: periodStartForBucket('month', baseInput.occurredAt)
    })).toBe(1);
  });

  it('does not increment twice for the same callAttemptId', async () => {
    const repo = createInMemoryFrequencyLedgerRepository();

    await recordFrequencyAttempt(repo, { ...baseInput, status: 'ringing' });
    const second = await recordFrequencyAttempt(repo, { ...baseInput, status: 'answered' });

    expect(second).toBe('duplicate');
    expect(await repo.getCount({
      tenantId: 'tenant-1',
      creditorKey: 'tenant-1',
      obligationId: 'AB-1001',
      bucket: 'day',
      periodStart: periodStartForBucket('day', baseInput.occurredAt)
    })).toBe(1);
  });

  it('does not count queued, initiated or blocked attempts', async () => {
    const repo = createInMemoryFrequencyLedgerRepository();

    expect(await recordFrequencyAttempt(repo, { ...baseInput, callAttemptId: 'q', status: 'queued' })).toBe('ignored');
    expect(await recordFrequencyAttempt(repo, { ...baseInput, callAttemptId: 'i', status: 'initiated' })).toBe('ignored');
    expect(await recordFrequencyAttempt(repo, { ...baseInput, callAttemptId: 'b', status: 'blocked' })).toBe('ignored');

    expect(await repo.getCount({
      tenantId: 'tenant-1',
      creditorKey: 'tenant-1',
      obligationId: 'AB-1001',
      bucket: 'day',
      periodStart: periodStartForBucket('day', baseInput.occurredAt)
    })).toBe(0);
  });
});

describe('shouldRecordFrequencyAttempt', () => {
  it('records only live production attempts', async () => {
    expect(shouldRecordFrequencyAttempt({ channel: 'sandbox', telephonyMode: 'production' })).toBe(false);
    expect(shouldRecordFrequencyAttempt({ channel: 'live', telephonyMode: 'sandbox' })).toBe(false);
    expect(shouldRecordFrequencyAttempt({ channel: 'live', telephonyMode: 'production' })).toBe(true);

    const repo = createInMemoryFrequencyLedgerRepository();
    if (shouldRecordFrequencyAttempt({ channel: 'live', telephonyMode: 'production' })) {
      await recordFrequencyAttempt(repo, { ...baseInput, status: 'ringing' });
    }

    expect(await repo.getCount({
      tenantId: 'tenant-1',
      creditorKey: 'tenant-1',
      obligationId: 'AB-1001',
      bucket: 'day',
      periodStart: periodStartForBucket('day', baseInput.occurredAt)
    })).toBe(1);
  });
});
