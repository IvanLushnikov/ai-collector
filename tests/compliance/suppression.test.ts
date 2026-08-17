import { describe, expect, it } from 'vitest';
import { SuppressionRule, createInMemorySuppressionLookup } from '../../src/compliance/rules/suppression.js';

const context = {
  tenantId: 'tenant-1',
  campaignId: 'campaign-1',
  debtorRecordId: 'debtor-1',
  phone: '+79501234567',
  timezone: 'Etc/UTC',
  debtAmount: 1000,
  debtStatus: 'active',
  consentStatus: 'given',
  obligationId: 'AB-1001'
};

describe('SuppressionRule', () => {
  it('allows when the tenant suppression list is empty', async () => {
    const result = await new SuppressionRule(createInMemorySuppressionLookup()).evaluate(context);
    expect(result).toEqual({ decision: 'allow' });
  });

  it('blocks by phone match', async () => {
    const lookup = createInMemorySuppressionLookup([
      { tenantId: 'tenant-1', phone: '+79501234567' }
    ]);

    const result = await new SuppressionRule(lookup).evaluate(context);

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'SUPPRESSION_BLOCK',
      reasonText: 'Contact is on the tenant suppression list'
    });
  });

  it('blocks by externalId match', async () => {
    const lookup = createInMemorySuppressionLookup([
      { tenantId: 'tenant-1', externalId: 'AB-1001' }
    ]);

    const result = await new SuppressionRule(lookup).evaluate(context);

    expect(result.reasonCode).toBe('SUPPRESSION_BLOCK');
  });

  it('does not block another tenant or unmatched identity', async () => {
    const lookup = createInMemorySuppressionLookup([
      { tenantId: 'other-tenant', phone: '+79501234567' },
      { tenantId: 'tenant-1', phone: '+79000000000' }
    ]);

    const result = await new SuppressionRule(lookup).evaluate(context);
    expect(result).toEqual({ decision: 'allow' });
  });
});
