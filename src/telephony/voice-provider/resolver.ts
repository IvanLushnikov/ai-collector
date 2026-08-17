import { VoiceProviderAdapter } from './adapter.js';

export class UnknownVoiceProviderError extends Error {
  readonly provider: string;

  constructor(provider: string) {
    super(`Unknown voice provider: ${provider}`);
    this.name = 'UnknownVoiceProviderError';
    this.provider = provider;
  }
}

export type VoiceProviderResolver = {
  resolve(provider: string): VoiceProviderAdapter;
};

export const createVoiceProviderResolver = (
  adapters: Record<string, VoiceProviderAdapter>
): VoiceProviderResolver => ({
  resolve(provider: string): VoiceProviderAdapter {
    const adapter = adapters[provider];
    if (!adapter) {
      throw new UnknownVoiceProviderError(provider);
    }

    return adapter;
  }
});
