import type {
  ProviderCredential,
  SpeechCapability,
  SpeechProvider
} from '../../domain/provider-credential/index.js';
import type { AppEnv } from '../../config/env.js';
import type { CredentialSecretStore } from '../../secrets/credential-store.js';
import { decryptSecret } from '../../secrets/envelope.js';

export type ResolvedSpeechCredential = {
  tenantId: string;
  capability: SpeechCapability;
  provider: SpeechProvider;
  mode: 'platform' | 'byok';
  apiKey: string;
  metadata: { folderId?: string; modelId?: string };
};

export type ResolveSpeechCredentialError =
  | 'SPEECH_CREDENTIAL_MISSING'
  | 'SPEECH_CREDENTIAL_DISABLED'
  | 'SPEECH_CREDENTIAL_INVALID'
  | 'SPEECH_CREDENTIAL_DECRYPT_FAILED';

export class SpeechCredentialResolveError extends Error {
  readonly code: ResolveSpeechCredentialError;

  constructor(code: ResolveSpeechCredentialError) {
    super(code);
    this.name = 'SpeechCredentialResolveError';
    this.code = code;
  }
}

export type PlatformSpeechEnv = Pick<
  AppEnv,
  'YANDEX_SPEECHKIT_API_KEY' | 'YANDEXGPT_API_KEY' | 'GIGACHAT_API_KEY' | 'YANDEX_FOLDER_ID'
>;

export type ResolveSpeechCredentialInput = {
  tenantId: string;
  capability: SpeechCapability;
  requireActive?: boolean;
  credentials: readonly ProviderCredential[];
  secretStore: CredentialSecretStore;
  dek: Buffer;
  env: PlatformSpeechEnv;
};

const metadataOf = (value: Record<string, unknown> | undefined): { folderId?: string; modelId?: string } => ({
  folderId: typeof value?.folderId === 'string' ? value.folderId : undefined,
  modelId: typeof value?.modelId === 'string' ? value.modelId : undefined
});

const platformApiKey = (capability: SpeechCapability, provider: SpeechProvider, env: PlatformSpeechEnv): string => {
  if (capability === 'asr' || capability === 'tts') {
    return env.YANDEX_SPEECHKIT_API_KEY;
  }
  if (provider === 'gigachat') {
    return env.GIGACHAT_API_KEY;
  }
  return env.YANDEXGPT_API_KEY;
};

const resolvePlatform = (
  tenantId: string,
  capability: SpeechCapability,
  env: PlatformSpeechEnv,
  credential?: ProviderCredential
): ResolvedSpeechCredential => {
  const provider: SpeechProvider = credential?.provider
    ?? (capability === 'llm' ? 'yandexgpt' : 'yandex_speechkit');
  const apiKey = platformApiKey(capability, provider, env);
  if (!apiKey) {
    throw new SpeechCredentialResolveError('SPEECH_CREDENTIAL_MISSING');
  }

  return {
    tenantId,
    capability,
    provider,
    mode: 'platform',
    apiKey,
    metadata: {
      ...metadataOf(credential?.metadata),
      folderId: metadataOf(credential?.metadata).folderId ?? (env.YANDEX_FOLDER_ID || undefined)
    }
  };
};

export const resolveSpeechCredential = async (
  input: ResolveSpeechCredentialInput
): Promise<ResolvedSpeechCredential> => {
  const requireActive = input.requireActive !== false;
  const credential = input.credentials.find(
    (row) => row.tenantId === input.tenantId && row.capability === input.capability
  );

  if (!credential || credential.mode === 'platform') {
    return resolvePlatform(input.tenantId, input.capability, input.env, credential);
  }

  if (credential.status === 'disabled') {
    throw new SpeechCredentialResolveError('SPEECH_CREDENTIAL_DISABLED');
  }

  if (requireActive && credential.status !== 'active') {
    throw new SpeechCredentialResolveError('SPEECH_CREDENTIAL_INVALID');
  }

  const secret = await input.secretStore.get(input.tenantId, credential.id);
  if (!secret) {
    throw new SpeechCredentialResolveError('SPEECH_CREDENTIAL_DECRYPT_FAILED');
  }

  try {
    const apiKey = decryptSecret({
      ciphertext: secret.ciphertext,
      nonce: secret.nonce,
      authTag: secret.authTag
    }, input.dek);

    if (!apiKey) {
      throw new SpeechCredentialResolveError('SPEECH_CREDENTIAL_DECRYPT_FAILED');
    }

    return {
      tenantId: input.tenantId,
      capability: input.capability,
      provider: credential.provider,
      mode: 'byok',
      apiKey,
      metadata: metadataOf(credential.metadata)
    };
  } catch (error) {
    if (error instanceof SpeechCredentialResolveError) {
      throw error;
    }
    throw new SpeechCredentialResolveError('SPEECH_CREDENTIAL_DECRYPT_FAILED');
  }
};
