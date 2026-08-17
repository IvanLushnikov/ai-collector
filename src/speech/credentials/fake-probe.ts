import { isSpeechProviderAllowed } from './allowlist.js';
import type { SpeechCredentialProbe, SpeechCredentialProbeResult } from './probe.js';

export const fakeSpeechCredentialProbe: SpeechCredentialProbe = {
  async probe(input): Promise<SpeechCredentialProbeResult> {
    if (!input.apiKey.trim()) {
      return 'failed';
    }
    if (!isSpeechProviderAllowed(input.capability, input.provider)) {
      return 'failed';
    }
    return 'ok';
  }
};
