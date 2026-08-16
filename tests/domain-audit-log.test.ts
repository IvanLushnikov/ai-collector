import { describe, expect, it } from 'vitest';
import { isAuditLogMetadata } from '../src/domain/audit-log/index.js';

describe('AuditLog metadata', () => {
  it('accepts nested structured objects with arrays and primitives', () => {
    const metadata = {
      actor: {
        type: 'system',
        ip: '127.0.0.1',
        tags: ['campaign', 'create']
      },
      amount: 1200,
      success: true,
      details: null
    };

    expect(isAuditLogMetadata(metadata)).toBe(true);
  });

  it('rejects metadata with unsupported values', () => {
    const metadata = {
      createdBy: {
        fn: () => 'not-serializable'
      }
    };

    expect(isAuditLogMetadata(metadata)).toBe(false);
  });
});
