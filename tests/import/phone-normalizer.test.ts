import { expect, it, describe } from 'vitest';
import { normalizePhone } from '../../src/import/phone-normalizer.js';

describe('normalizePhone', () => {
  it('normalizes phone with spaces, braces and dashes', () => {
    const result = normalizePhone('+7 (950) 123-45-67');

    expect(result.error).toBeUndefined();
    expect(result.value).toBe('+79501234567');
  });

  it('returns error for too short number', () => {
    const result = normalizePhone('123');

    expect(result.value).toBeUndefined();
    expect(result.error?.code).toBe('INVALID_PHONE_FORMAT');
  });
});
