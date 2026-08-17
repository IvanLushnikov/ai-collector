import { describe, expect, it } from 'vitest';
import { IdentityGateError } from '../../src/dialogue/llm/tools.js';
import { extractCallResultFromToolCall } from '../../src/dialogue/extractor.js';

describe('CallResult extractor', () => {
  it('extracts a PTP amount from an allowlisted tool call', () => {
    expect(extractCallResultFromToolCall({
      name: 'confirm_ptp',
      arguments: { ptpAmount: 8000, ptpDate: '2026-08-21', reason: 'salary' }
    }, { identityVerified: true })).toMatchObject({
      outcome: 'ptp_created',
      ptpAmount: 8000,
      reason: 'salary'
    });
  });

  it('rejects confirm_ptp without identityVerified', () => {
    expect(() => extractCallResultFromToolCall({
      name: 'confirm_ptp',
      arguments: { ptpAmount: 8000 }
    }, { identityVerified: false })).toThrow(IdentityGateError);
  });

  it('does not write an amount from invalid JSON-like payload', () => {
    expect(extractCallResultFromToolCall({
      name: 'confirm_ptp',
      arguments: { ptpAmount: 'not-a-number' }
    }, { identityVerified: true })).toEqual({
      outcome: 'ptp_created',
      reason: undefined
    });
  });
});
