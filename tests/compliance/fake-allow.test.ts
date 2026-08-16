import { expect, describe, it } from 'vitest';
import { FakeAllowComplianceRule } from '../../src/compliance/rules/fake-allow.js';

describe('FakeAllowComplianceRule', () => {
  it('returns allow decision through interface contract', async () => {
    const rule = new FakeAllowComplianceRule();
    const result = rule.evaluate({
      tenantId: 'tenant-1',
      campaignId: 'campaign-1',
      debtorRecordId: 'debtor-1',
      phone: '+79501234567',
      timezone: 'Europe/Moscow',
      debtAmount: 1000,
      debtStatus: 'active',
      consentStatus: 'given'
    });

    expect(result).toEqual({ decision: 'allow' });
    expect(result.decision).toBe('allow');
  });
});
