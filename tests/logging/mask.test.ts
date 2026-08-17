import { describe, expect, it } from 'vitest';
import { maskPhone, maskSensitiveFields } from '../../src/logging/mask.js';

describe('maskPhone', () => {
  it('masks a Russian E.164 number as +7 with last four digits', () => {
    expect(maskPhone('+79501234567')).toBe('+7 •••-••-45-67');
  });

  it('masks a formatted Russian number the same way', () => {
    expect(maskPhone('+7 (950) 123-45-67')).toBe('+7 •••-••-45-67');
  });

  it('falls back to last four digits for other numbers', () => {
    expect(maskPhone('+14155550199')).toBe('••••0199');
  });

  it('masks short or empty values without leaking digits', () => {
    expect(maskPhone('12')).toBe('••••');
    expect(maskPhone('')).toBe('••••');
  });
});

describe('maskSensitiveFields', () => {
  it('masks phone keys in nested audit payloads', () => {
    const masked = maskSensitiveFields({
      debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      phone: '+79501234567',
      nested: { phoneNumber: '+79032221122' }
    });

    expect(masked).toEqual({
      debtorRecordId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      phone: '+7 •••-••-45-67',
      nested: { phoneNumber: '+7 •••-••-11-22' }
    });
  });

  it('does not treat non-phone keys as phone numbers', () => {
    expect(maskSensitiveFields({ campaignId: 'campaign-1', timezone: 'UTC' })).toEqual({
      campaignId: 'campaign-1',
      timezone: 'UTC'
    });
  });
});
