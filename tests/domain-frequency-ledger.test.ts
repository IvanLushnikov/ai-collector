import { describe, expect, it } from 'vitest';
import {
  PRODUCT_FREQUENCY_CAPS,
  isFrequencyBucket
} from '../src/domain/frequency-ledger/index.js';

describe('FrequencyLedger domain', () => {
  it('exposes product caps 1/2/8 for day/week/month buckets', () => {
    expect(PRODUCT_FREQUENCY_CAPS).toEqual({
      day: 1,
      week: 2,
      month: 8
    });
    expect(isFrequencyBucket('day')).toBe(true);
    expect(isFrequencyBucket('week')).toBe(true);
    expect(isFrequencyBucket('month')).toBe(true);
    expect(isFrequencyBucket('year')).toBe(false);
  });
});
