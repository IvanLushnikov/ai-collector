import { describe, expect, it } from 'vitest';
import { calculateCostFromMinutes, validateCampaignBillingRates, isPlatformBillableUsage, sumPlatformSpeechUnits } from '../src/domain/billing/index.js';

describe('billing rates', () => {
  it('validates positive connected minute rate', () => {
    expect(() => validateCampaignBillingRates({ connectedMinuteRateRub: 0.5 })).not.toThrow();
    expect(() => validateCampaignBillingRates({ connectedMinuteRateRub: -0.1 })).toThrowError(/positive/);
    expect(() => validateCampaignBillingRates({ connectedMinuteRateRub: 0 })).toThrowError(/positive/);
  });

  it('uses provided valid rate in minute cost calculation', () => {
    expect(calculateCostFromMinutes(10, 5, { connectedMinuteRateRub: 2.5 })).toBe(5);
  });
});

describe('platform speech billing mapper', () => {
  it('excludes BYOK speech units from the platform invoice', () => {
    const events = [
      { eventType: 'asr_units', quantity: 10, credentialMode: 'byok' },
      { eventType: 'tts_units', quantity: 4, credentialMode: 'platform' },
      { eventType: 'llm_units', quantity: 2, credentialMode: 'platform' },
      { eventType: 'call_completed', quantity: 3, credentialMode: 'fake' }
    ];

    expect(sumPlatformSpeechUnits(events)).toBe(6);
    expect(events.filter(isPlatformBillableUsage).map((event) => event.eventType)).toEqual([
      'tts_units',
      'llm_units',
      'call_completed'
    ]);
  });
});

