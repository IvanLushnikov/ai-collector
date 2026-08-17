import type { ProviderCredential, SpeechCapability } from '../../domain/provider-credential/index.js';
import { isSpeechProviderAllowed } from './allowlist.js';
import {
  resolveSpeechCredential,
  SpeechCredentialResolveError,
  type PlatformSpeechEnv,
  type ResolvedSpeechCredential,
  type ResolveSpeechCredentialInput
} from './resolve.js';

const CAPABILITIES: SpeechCapability[] = ['asr', 'tts', 'llm'];

export const isSpeechCapabilityReady = (input: {
  capability: SpeechCapability;
  credential?: ProviderCredential | null;
  env: PlatformSpeechEnv;
}): boolean => {
  const credential = input.credential;
  if (credential?.mode === 'byok') {
    return credential.status === 'active'
      && isSpeechProviderAllowed(credential.capability, credential.provider);
  }

  try {
    // Platform path: presence of env key is enough for readiness (no decrypt).
    const provider = credential?.provider
      ?? (input.capability === 'llm' ? 'yandexgpt' : 'yandex_speechkit');
    if (input.capability === 'asr' || input.capability === 'tts') {
      return Boolean(input.env.YANDEX_SPEECHKIT_API_KEY);
    }
    if (provider === 'gigachat') {
      return Boolean(input.env.GIGACHAT_API_KEY);
    }
    return Boolean(input.env.YANDEXGPT_API_KEY);
  } catch {
    return false;
  }
};

export const areSpeechCredentialsReady = (input: {
  tenantId: string;
  credentials: readonly ProviderCredential[];
  env: PlatformSpeechEnv;
}): boolean => CAPABILITIES.every((capability) => isSpeechCapabilityReady({
  capability,
  credential: input.credentials.find(
    (row) => row.tenantId === input.tenantId && row.capability === capability
  ) ?? null,
  env: input.env
}));

export const assertSpeechCredentialsReady = async (
  input: Omit<ResolveSpeechCredentialInput, 'capability' | 'requireActive'>
): Promise<ResolvedSpeechCredential[]> => {
  const resolved: ResolvedSpeechCredential[] = [];
  for (const capability of CAPABILITIES) {
    resolved.push(await resolveSpeechCredential({
      ...input,
      capability,
      requireActive: true
    }));
  }
  return resolved;
};

export { SpeechCredentialResolveError };
