import { describe, expect, it } from 'vitest';
import { isCallResultQaStatus } from '../src/domain/call-result/index.js';

describe('CallResult QA status', () => {
  it('accepts all known QA status values', () => {
    expect(isCallResultQaStatus('not_reviewed')).toBe(true);
    expect(isCallResultQaStatus('approved')).toBe(true);
    expect(isCallResultQaStatus('flagged')).toBe(true);
  });

  it('rejects unknown QA status values', () => {
    expect(isCallResultQaStatus('invalid_status')).toBe(false);
    expect(isCallResultQaStatus(123)).toBe(false);
    expect(isCallResultQaStatus(null)).toBe(false);
    expect(isCallResultQaStatus(undefined)).toBe(false);
  });
});
