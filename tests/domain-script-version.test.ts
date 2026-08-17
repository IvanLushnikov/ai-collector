import { describe, expect, it } from 'vitest';
import { isLockedDisclosureContent } from '../src/domain/script-version/index.js';

describe('ScriptVersion locked disclosure', () => {
  it('rejects content without agentName, agentId and creditorName', () => {
    expect(isLockedDisclosureContent('Hello script')).toBe(false);
    expect(isLockedDisclosureContent({ body: 'Hello script' })).toBe(false);
    expect(isLockedDisclosureContent({
      agentName: 'Anna',
      agentId: 'agent-1'
    })).toBe(false);
  });

  it('accepts content with the three locked disclosure fields', () => {
    expect(isLockedDisclosureContent({
      agentName: 'Anna',
      agentId: 'agent-1',
      creditorName: 'Example Bank',
      body: 'optional script text'
    })).toBe(true);
  });
});
