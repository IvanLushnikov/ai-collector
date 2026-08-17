import { describe, expect, it } from 'vitest';
import { createSafeLogRecord, serializeUnknownError } from '../../src/logging/logger.js';

describe('safe logger', () => {
  it('does not dump a DebtorRecord-shaped error payload', () => {
    const record = createSafeLogRecord({
      level: 'error',
      message: 'import failed',
      requestId: 'req-1',
      tenantId: 'tenant-1',
      campaignId: 'campaign-1',
      error: { phone: '+79501234567', debtAmount: 1200, externalId: 'AB' },
      extra: { phone: '+79501234567', debtAmount: 1200 }
    });

    const serialized = JSON.stringify(record);
    expect(serialized).not.toContain('+79501234567');
    expect(serialized).not.toContain('1200');
    expect(record.error).toEqual({ name: 'Error', message: 'unknown error' });
  });

  it('keeps request and tenant identifiers', () => {
    const record = createSafeLogRecord({
      level: 'info',
      message: 'ok',
      requestId: 'req-1',
      tenantId: 'tenant-1'
    });
    expect(record.requestId).toBe('req-1');
    expect(record.tenantId).toBe('tenant-1');
  });

  it('serializes Error instances without nested records', () => {
    expect(serializeUnknownError(new Error('boom'))).toEqual({ name: 'Error', message: 'boom' });
  });
});
