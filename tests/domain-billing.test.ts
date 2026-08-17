import { describe, expect, it } from 'vitest';
import { calculateCostFromMinutes, validateCampaignBillingRates } from '../src/domain/billing/index.js';

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
