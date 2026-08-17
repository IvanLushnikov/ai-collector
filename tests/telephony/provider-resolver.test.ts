import { describe, expect, it } from 'vitest';
import { SandboxVoiceProvider } from '../../src/telephony/sandbox-provider/index.js';
import {
  UnknownVoiceProviderError,
  createVoiceProviderResolver
} from '../../src/telephony/voice-provider/resolver.js';

describe('createVoiceProviderResolver', () => {
  it('resolves sandbox to SandboxVoiceProvider', () => {
    const sandbox = new SandboxVoiceProvider();
    const resolver = createVoiceProviderResolver({ sandbox });

    expect(resolver.resolve('sandbox')).toBe(sandbox);
  });

  it('throws for an unknown provider instead of falling back to live', () => {
    const resolver = createVoiceProviderResolver({
      sandbox: new SandboxVoiceProvider()
    });

    expect(() => resolver.resolve('exolve')).toThrow(UnknownVoiceProviderError);
    expect(() => resolver.resolve('mango')).toThrow(UnknownVoiceProviderError);
  });
});
