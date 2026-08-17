import { describe, expect, it } from 'vitest';
import {
  isProductNonWorkingHoliday,
  localCalendarDate
} from '../../src/compliance/rules/russian-holidays.js';

describe('russian holidays product calendar', () => {
  it('exposes 2026-01-01 as a product non-working day independently of evaluate()', () => {
    expect(localCalendarDate('Etc/UTC', new Date('2026-01-01T08:30:00.000Z'))).toBe('2026-01-01');
    expect(isProductNonWorkingHoliday('2026-01-01')).toBe(true);
    expect(isProductNonWorkingHoliday('2026-08-17')).toBe(false);
  });
});
