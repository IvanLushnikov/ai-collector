import { describe, expect, it } from 'vitest';
import { isPromptStatus } from '../src/domain/prompt-version/index.js';

describe('PromptVersion', () => {
  it('accepts draft, active and archived statuses', () => {
    expect(isPromptStatus('draft')).toBe(true);
    expect(isPromptStatus('active')).toBe(true);
    expect(isPromptStatus('archived')).toBe(true);
    expect(isPromptStatus('published')).toBe(false);
  });
});
