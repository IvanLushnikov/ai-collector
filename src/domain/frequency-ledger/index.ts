export type FrequencyBucket = 'day' | 'week' | 'month';

/**
 * Product-frame caps from the rulebook. Not a legal fact of ФЗ-230.
 * Live enforcement as "the law" waits for legal memo (T-138 / T-139).
 */
export const PRODUCT_FREQUENCY_CAPS: Record<FrequencyBucket, number> = {
  day: 1,
  week: 2,
  month: 8
};

export interface FrequencyLedger {
  id: string;
  tenantId: string;
  creditorKey: string;
  obligationId: string;
  bucket: FrequencyBucket;
  periodStart: Date;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

export const isFrequencyBucket = (value: string): value is FrequencyBucket => {
  return value === 'day' || value === 'week' || value === 'month';
};

export const shouldRecordFrequencyAttempt = (input: {
  channel: 'sandbox' | 'live';
  telephonyMode: string;
}): boolean => {
  return input.channel === 'live' && input.telephonyMode === 'production';
};

const COUNTABLE_STATUSES = new Set([
  'ringing',
  'answered',
  'failed',
  'completed',
  'no_answer'
]);

export type FrequencyLedgerKey = {
  tenantId: string;
  creditorKey: string;
  obligationId: string;
  bucket: FrequencyBucket;
  periodStart: Date;
};

export type RecordFrequencyAttemptInput = {
  callAttemptId: string;
  tenantId: string;
  creditorKey: string;
  obligationId: string;
  status: string;
  occurredAt: Date;
};

export type RecordFrequencyAttemptResult = 'counted' | 'ignored' | 'duplicate';

export type FrequencyLedgerRepository = {
  wasAttemptRecorded: (callAttemptId: string) => Promise<boolean>;
  markAttemptRecorded: (callAttemptId: string) => Promise<void>;
  incrementBucket: (key: FrequencyLedgerKey) => Promise<void>;
  getCount: (key: FrequencyLedgerKey) => Promise<number>;
};

const utcDateParts = (value: Date): { year: number; month: number; day: number } => {
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth(),
    day: value.getUTCDate()
  };
};

export const periodStartForBucket = (bucket: FrequencyBucket, occurredAt: Date): Date => {
  const { year, month, day } = utcDateParts(occurredAt);

  if (bucket === 'day') {
    return new Date(Date.UTC(year, month, day));
  }

  if (bucket === 'month') {
    return new Date(Date.UTC(year, month, 1));
  }

  const utcMidnight = new Date(Date.UTC(year, month, day));
  const weekday = utcMidnight.getUTCDay();
  const daysFromMonday = (weekday + 6) % 7;
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - daysFromMonday);
  return utcMidnight;
};

const ledgerKeyId = (key: FrequencyLedgerKey): string => {
  return [
    key.tenantId,
    key.creditorKey,
    key.obligationId,
    key.bucket,
    key.periodStart.toISOString()
  ].join('|');
};

export const createInMemoryFrequencyLedgerRepository = (): FrequencyLedgerRepository => {
  const attempts = new Set<string>();
  const counts = new Map<string, number>();

  return {
    async wasAttemptRecorded(callAttemptId) {
      return attempts.has(callAttemptId);
    },
    async markAttemptRecorded(callAttemptId) {
      attempts.add(callAttemptId);
    },
    async incrementBucket(key) {
      const id = ledgerKeyId(key);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    },
    async getCount(key) {
      return counts.get(ledgerKeyId(key)) ?? 0;
    }
  };
};

export const recordFrequencyAttempt = async (
  repo: FrequencyLedgerRepository,
  input: RecordFrequencyAttemptInput
): Promise<RecordFrequencyAttemptResult> => {
  if (!COUNTABLE_STATUSES.has(input.status)) {
    return 'ignored';
  }

  if (await repo.wasAttemptRecorded(input.callAttemptId)) {
    return 'duplicate';
  }

  await repo.markAttemptRecorded(input.callAttemptId);

  const buckets: FrequencyBucket[] = ['day', 'week', 'month'];
  for (const bucket of buckets) {
    await repo.incrementBucket({
      tenantId: input.tenantId,
      creditorKey: input.creditorKey,
      obligationId: input.obligationId,
      bucket,
      periodStart: periodStartForBucket(bucket, input.occurredAt)
    });
  }

  return 'counted';
};
