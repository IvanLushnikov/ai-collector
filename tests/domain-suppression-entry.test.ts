import { describe, expect, it } from 'vitest';
import { isSuppressionEntry } from '../src/domain/suppression-entry/index.js';

describe('SuppressionEntry domain', () => {
  it('accepts tenant-scoped entries with phone or externalId and a reason', () => {
    expect(isSuppressionEntry({
      id: 'sup-1',
      tenantId: 'tenant-1',
      phone: '+79501234567',
      externalId: null,
      reason: 'opt-out',
      createdAt: new Date('2026-08-17T10:00:00.000Z')
    })).toBe(true);

    expect(isSuppressionEntry({
      id: 'sup-2',
      tenantId: 'tenant-1',
      phone: null,
      externalId: 'AB-1001',
      reason: 'vulnerable-client',
      createdAt: new Date('2026-08-17T10:00:00.000Z')
    })).toBe(true);
  });

  it('rejects entries without phone and externalId', () => {
    expect(isSuppressionEntry({
      id: 'sup-3',
      tenantId: 'tenant-1',
      phone: null,
      externalId: null,
      reason: 'opt-out',
      createdAt: new Date()
    })).toBe(false);
  });
});
