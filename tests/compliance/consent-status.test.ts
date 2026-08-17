import { expect, describe, it } from 'vitest';
import { ConsentStatusRule } from '../../src/compliance/rules/consent-status.js';

describe('ConsentStatusRule', () => {
  const context = {
    tenantId: 'tenant-1',
    campaignId: 'campaign-1',
    debtorRecordId: 'debtor-1',
    phone: '+79501234567',
    timezone: 'Europe/Moscow',
    debtAmount: 1000,
    debtStatus: 'active'
  };

  it('blocks when consent is revoked', () => {
    const rule = new ConsentStatusRule();
    const result = rule.evaluate({
      ...context,
      consentStatus: 'revoked'
    });

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'CONSENT_REVOKED',
      reasonText: 'Consent status is revoked'
    });
  });

  it('blocks when consent is pending', () => {
    const rule = new ConsentStatusRule();
    const result = rule.evaluate({
      ...context,
      consentStatus: 'pending'
    });

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'CONSENT_PENDING_BLOCK',
      reasonText: 'Consent status is pending'
    });
  });

  it('allows when consent is given', () => {
    const rule = new ConsentStatusRule();
    const result = rule.evaluate({
      ...context,
      consentStatus: 'given'
    });

    expect(result).toEqual({ decision: 'allow' });
  });
});
