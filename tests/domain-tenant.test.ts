import { describe, expect, it } from 'vitest';
import { DEFAULT_LEGAL_BASIS_STATUS, isLegalBasisStatus } from '../src/domain/tenant/index.js';

describe('Tenant legalBasisStatus', () => {
  it('defaults new tenants to pending', () => {
    expect(DEFAULT_LEGAL_BASIS_STATUS).toBe('pending');
    expect(isLegalBasisStatus('pending')).toBe(true);
    expect(isLegalBasisStatus('confirmed')).toBe(true);
    expect(isLegalBasisStatus('revoked')).toBe(true);
    expect(isLegalBasisStatus('approved')).toBe(false);
  });
});
