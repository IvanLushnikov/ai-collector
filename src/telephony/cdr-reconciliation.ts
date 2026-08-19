export type ProviderCdrRecord = {
  providerCallId: string;
  providerStatus: string;
};

export type AttemptCdrRecord = {
  providerCallId: string;
  status: string;
};

export type CdrMismatch = {
  providerCallId: string;
  providerStatus: string | null;
  attemptStatus: string | null;
  kind: 'missing_attempt' | 'missing_cdr' | 'status_mismatch';
};

export type CdrReconciliationResult = {
  mismatches: CdrMismatch[];
  events: Array<{ action: 'cdr.mismatch'; entityType: 'callAttempt'; entityId: string; metadata: CdrMismatch }>;
};

export const reconcileCdr = (
  providerRecords: ProviderCdrRecord[],
  attempts: AttemptCdrRecord[]
): CdrReconciliationResult => {
  const attemptsById = new Map(attempts.map((item) => [item.providerCallId, item]));
  const providerById = new Map(providerRecords.map((item) => [item.providerCallId, item]));
  const mismatches: CdrMismatch[] = [];

  for (const record of providerRecords) {
    const attempt = attemptsById.get(record.providerCallId);
    if (!attempt) {
      mismatches.push({
        providerCallId: record.providerCallId,
        providerStatus: record.providerStatus,
        attemptStatus: null,
        kind: 'missing_attempt'
      });
      continue;
    }
    if (attempt.status !== record.providerStatus) {
      mismatches.push({
        providerCallId: record.providerCallId,
        providerStatus: record.providerStatus,
        attemptStatus: attempt.status,
        kind: 'status_mismatch'
      });
    }
  }

  for (const attempt of attempts) {
    if (!providerById.has(attempt.providerCallId)) {
      mismatches.push({
        providerCallId: attempt.providerCallId,
        providerStatus: null,
        attemptStatus: attempt.status,
        kind: 'missing_cdr'
      });
    }
  }

  return {
    mismatches,
    events: mismatches.map((mismatch) => ({
      action: 'cdr.mismatch',
      entityType: 'callAttempt',
      entityId: mismatch.providerCallId,
      metadata: mismatch
    }))
  };
};
