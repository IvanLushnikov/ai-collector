import { describe, expect, it } from 'vitest';
import { reconcileCdr } from '../../src/telephony/cdr-reconciliation.js';

describe('CDR reconciliation stub', () => {
  it('emits an audit-style mismatch event without deleting attempts', () => {
    const result = reconcileCdr(
      [{ providerCallId: 'p-1', providerStatus: 'completed' }],
      [{ providerCallId: 'p-1', status: 'failed' }]
    );

    expect(result.mismatches).toEqual([
      {
        providerCallId: 'p-1',
        providerStatus: 'completed',
        attemptStatus: 'failed',
        kind: 'status_mismatch',
        severity: 'warning'
      }
    ]);
    expect(result.events[0]).toMatchObject({
      action: 'cdr.mismatch',
      entityType: 'callAttempt',
      entityId: 'p-1'
    });
    expect(result.events[0]?.metadata.kind).toBe('status_mismatch');
  });

  it('marks missing records as critical', () => {
    const result = reconcileCdr(
      [{ providerCallId: 'provider-only', providerStatus: 'completed' }],
      [{ providerCallId: 'attempt-only', status: 'failed' }]
    );

    expect(result.mismatches).toEqual([
      {
        providerCallId: 'provider-only',
        providerStatus: 'completed',
        attemptStatus: null,
        kind: 'missing_attempt',
        severity: 'critical'
      },
      {
        providerCallId: 'attempt-only',
        providerStatus: null,
        attemptStatus: 'failed',
        kind: 'missing_cdr',
        severity: 'critical'
      }
    ]);
  });
});
