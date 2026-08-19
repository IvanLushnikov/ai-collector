import { describe, expect, it, vi } from 'vitest';
import {
  createPrismaFrequencyLedgerRepository,
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
  it('persists an attempt and all buckets in one transaction', async () => {
    const attemptCreate = vi.fn(async () => ({ id: 'ledger-attempt-1' }));
    const upsert = vi.fn(async () => ({}));
    const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      frequencyLedgerAttempt: { create: attemptCreate },
      frequencyLedger: { upsert }
    }));
    const repo = createPrismaFrequencyLedgerRepository({
      $transaction: transaction,
      frequencyLedgerAttempt: {
        findUnique: vi.fn(),
        create: attemptCreate
      },
      frequencyLedger: { findUnique: vi.fn(), upsert }
    } as any);

    await expect(recordFrequencyAttempt(repo, { ...baseInput, status: 'ringing' })).resolves.toBe('counted');

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(attemptCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        callAttemptId: baseInput.callAttemptId,
        tenantId: baseInput.tenantId,
        status: 'ringing'
      })
    });
    expect(upsert).toHaveBeenCalledTimes(3);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ count: 1 }),
      update: { count: { increment: 1 } }
    }));
  });

  it('treats a duplicate durable attempt as a no-op', async () => {
    const upsert = vi.fn(async () => ({}));
    const transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      frequencyLedgerAttempt: {
        create: vi.fn(async () => {
          throw { code: 'P2002' };
        })
      },
      frequencyLedger: { upsert }
    }));
    const repo = createPrismaFrequencyLedgerRepository({
      $transaction: transaction,
      frequencyLedgerAttempt: { findUnique: vi.fn(), create: vi.fn() },
      frequencyLedger: { findUnique: vi.fn(), upsert }
    } as any);

    await expect(recordFrequencyAttempt(repo, { ...baseInput, status: 'answered' })).resolves.toBe('duplicate');
    expect(upsert).not.toHaveBeenCalled();
  });

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
