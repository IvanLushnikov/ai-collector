import { expect, describe, it, vi } from 'vitest';
import { CallWindowComplianceRule } from '../../src/compliance/rules/call-window.js';

const context = {
  tenantId: 'tenant-1',
  campaignId: 'campaign-1',
  debtorRecordId: 'debtor-1',
  phone: '+79501234567',
  timezone: 'Etc/UTC',
  debtAmount: 1000,
  debtStatus: 'active',
  consentStatus: 'given'
} as const;

describe('CallWindowComplianceRule', () => {
  it('allows a weekday call at 21:30 local time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T21:30:00.000Z'));

    const result = new CallWindowComplianceRule().evaluate({ ...context });

    expect(result).toEqual({ decision: 'allow' });

    vi.useRealTimers();
  });

  it('blocks a Sunday call at 08:30 local time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-16T08:30:00.000Z'));

    const result = new CallWindowComplianceRule().evaluate({ ...context });

    expect(result).toEqual({
      decision: 'block',
      reasonCode: 'CALL_WINDOW_BLOCK',
      reasonText: expect.stringMatching(/weekend 09:00-20:00/i)
    });
    expect(result.reasonText).not.toMatch(/ФЗ-230|FZ-230|230-ФЗ/i);

    vi.useRealTimers();
  });

  it('allows a Sunday call inside the weekend window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-16T11:00:00.000Z'));

    const result = new CallWindowComplianceRule().evaluate({ ...context });

    expect(result).toEqual({ decision: 'allow' });

    vi.useRealTimers();
  });

  it('blocks a weekday call after 22:00 local time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T22:00:00.000Z'));

    const result = new CallWindowComplianceRule().evaluate({ ...context });

    expect(result.decision).toBe('block');
    expect(result.reasonCode).toBe('CALL_WINDOW_BLOCK');
    expect(result.reasonText).not.toMatch(/ФЗ-230|FZ-230|230-ФЗ/i);

    vi.useRealTimers();
  });

  it('allows a known holiday at 10:00 local time using the weekend window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

    const result = new CallWindowComplianceRule().evaluate({ ...context });

    expect(result).toEqual({ decision: 'allow' });

    vi.useRealTimers();
  });

  it('blocks a known holiday at 08:30 local time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T08:30:00.000Z'));

    const result = new CallWindowComplianceRule().evaluate({ ...context });

    expect(result.decision).toBe('block');
    expect(result.reasonCode).toBe('CALL_WINDOW_BLOCK');

    vi.useRealTimers();
  });
});
