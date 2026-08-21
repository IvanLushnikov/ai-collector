import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_PAUSE_REASON_TEXT,
  enrichBlockedReason,
  resolveBlockKindFromReasonCode,
  toComplianceDecisionSummary
} from '../../src/domain/compliance-block-kind/index.js';

describe('compliance block kind (OP-T-007)', () => {
  it('maps SUPPRESSION_BLOCK to permanent', () => {
    expect(resolveBlockKindFromReasonCode('SUPPRESSION_BLOCK')).toBe('permanent');
  });

  it('maps CALL_WINDOW_BLOCK and FREQUENCY_LIMIT_BLOCK to temporary', () => {
    expect(resolveBlockKindFromReasonCode('CALL_WINDOW_BLOCK')).toBe('temporary');
    expect(resolveBlockKindFromReasonCode('FREQUENCY_LIMIT_BLOCK')).toBe('temporary');
  });

  it('prefers permanent when aggregated with temporary codes', () => {
    expect(resolveBlockKindFromReasonCode('CALL_WINDOW_BLOCK|SUPPRESSION_BLOCK')).toBe('permanent');
  });

  it('returns null for unrelated block codes and allow decisions', () => {
    expect(resolveBlockKindFromReasonCode('CONSENT_REVOKED')).toBeNull();
    expect(toComplianceDecisionSummary({
      decision: 'allow',
      reasonCode: 'ALLOW',
      reasonText: 'OK'
    }).blockKind).toBeNull();
  });

  it('enriches blocked reasons for API responses', () => {
    expect(enrichBlockedReason({
      decision: 'block',
      reasonCode: 'SUPPRESSION_BLOCK',
      reasonText: 'Контакт в списке исключений'
    })).toEqual({
      decision: 'block',
      reasonCode: 'SUPPRESSION_BLOCK',
      reasonText: 'Контакт в списке исключений',
      blockKind: 'permanent'
    });
  });

  it('documents campaign_pause copy for UI without suppression rows', () => {
    expect(CAMPAIGN_PAUSE_REASON_TEXT).toMatch(/приостановлен/i);
  });
});
