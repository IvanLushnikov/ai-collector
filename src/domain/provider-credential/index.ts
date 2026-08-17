export const SPEECH_CAPABILITIES = ['asr', 'tts', 'llm'] as const;
export type SpeechCapability = (typeof SPEECH_CAPABILITIES)[number];

export const SPEECH_PROVIDERS = ['yandex_speechkit', 'yandexgpt', 'gigachat'] as const;
export type SpeechProvider = (typeof SPEECH_PROVIDERS)[number];

export const CREDENTIAL_MODES = ['platform', 'byok'] as const;
export type CredentialMode = (typeof CREDENTIAL_MODES)[number];

export const CREDENTIAL_STATUSES = [
  'inactive',
  'pending_probe',
  'active',
  'invalid',
  'disabled',
] as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

export const PROBE_RESULTS = ['ok', 'failed'] as const;
export type ProbeResult = (typeof PROBE_RESULTS)[number];

export type ProviderCredential = {
  id: string;
  tenantId: string;
  capability: SpeechCapability;
  provider: SpeechProvider;
  mode: CredentialMode;
  status: CredentialStatus;
  displayName: string;
  secretHint: string | null;
  metadata: Record<string, unknown>;
  lastProbedAt: Date | null;
  lastProbeResult: ProbeResult | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicProviderCredential = ProviderCredential;
