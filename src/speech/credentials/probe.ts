export type SpeechCredentialProbeInput = {
  apiKey: string;
  provider: string;
  capability: string;
};

export type SpeechCredentialProbeResult = 'ok' | 'failed';

export interface SpeechCredentialProbe {
  probe: (input: SpeechCredentialProbeInput) => Promise<SpeechCredentialProbeResult>;
}
