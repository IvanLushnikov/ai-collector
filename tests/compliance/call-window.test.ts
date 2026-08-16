import { expect, describe, it, vi } from 'vitest';
import { CallWindowComplianceRule } from '../../src/compliance/rules/call-window.js';

describe('CallWindowComplianceRule', () => {
  it('allows calls inside configured time window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-16T11:00:00.000Z'));

    const rule = new CallWindowComplianceRule('08:00-22:00');

    const result = rule.evaluate({
      tenantId: 'tenant-1',
      campaignId: 'campaign-1',
      debtorRecordId: 'debtor-1',
      phone: '+79501234567',
      timezone: 'Etc/UTC',
      debtAmount: 1000,
      debtStatus: 'active',
      consentStatus: 'given'
    });

    expect(result).toEqual({ decision: 'allow' });

    vi.useRealTimers();
  });

  it('blocks calls outside configured time window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-16T23:00:00.000Z'));

    const rule = new CallWindowComplianceRule('08:00-22:00');

    const result = rule.evaluate({
      tenantId: 'tenant-1',
      campaignId: 'campaign-1',
      debtorRecordId: 'debtor-1',
      phone: '+79501234567',
      timezone: 'Etc/UTC',
      debtAmount: 1000,
      debtStatus: 'active',
      consentStatus: 'given'
    });

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'CALL_WINDOW_BLOCK',
      reasonText: 'Call window is restricted to 08:00-22:00'
    });

    vi.useRealTimers();
  });
});
