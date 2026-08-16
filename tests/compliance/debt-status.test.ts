import { expect, describe, it } from 'vitest';
import { DebtStatusRule } from '../../src/compliance/rules/debt-status.js';

describe('DebtStatusRule', () => {
  const context = {
    tenantId: 'tenant-1',
    campaignId: 'campaign-1',
    debtorRecordId: 'debtor-1',
    phone: '+79501234567',
    timezone: 'Europe/Moscow',
    debtAmount: 1000,
    consentStatus: 'given'
  };

  it('blocks denied debt statuses', () => {
    const rule = new DebtStatusRule();
    const result = rule.evaluate({
      ...context,
      debtStatus: 'closed'
    });

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'DEBT_STATUS_BLOCK',
      reasonText: 'Debt status closed is blocked'
    });
  });

  it('allows active debt status', () => {
    const rule = new DebtStatusRule();
    const result = rule.evaluate({
      ...context,
      debtStatus: 'active'
    });

    expect(result).toEqual({ decision: 'allow' });
  });
});
