import { describe, expect, it } from 'vitest';
import type { ProviderCredential } from '../../src/domain/provider-credential/index.js';
import { createInMemoryCredentialSecretStore } from '../../src/secrets/credential-store.js';
import { encryptSecret, parseDekHex } from '../../src/secrets/envelope.js';
import {
  resolveSpeechCredential,
  SpeechCredentialResolveError
} from '../../src/speech/credentials/resolve.js';

const DEK = parseDekHex('a'.repeat(64));

const baseCredential = (overrides: Partial<ProviderCredential> = {}): ProviderCredential => ({
  id: 'cred-1',
  tenantId: 'tenant-1',
  capability: 'asr',
  provider: 'yandex_speechkit',
  mode: 'byok',
  status: 'active',
  displayName: 'SpeechKit',
  secretHint: 'cret',
  metadata: { folderId: 'folder-1' },
  lastProbedAt: null,
  lastProbeResult: null,
  createdAt: new Date('2026-08-17T00:00:00.000Z'),
  updatedAt: new Date('2026-08-17T00:00:00.000Z'),
  ...overrides
});

describe('resolveSpeechCredential', () => {
  it('resolves platform env when no credential row exists', async () => {
    const resolved = await resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'asr',
      credentials: [],
      secretStore: createInMemoryCredentialSecretStore(),
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'platform-asr',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: 'folder-env'
      }
    });

    expect(resolved).toMatchObject({
      tenantId: 'tenant-1',
      capability: 'asr',
      provider: 'yandex_speechkit',
      mode: 'platform',
      apiKey: 'platform-asr',
      metadata: { folderId: 'folder-env' }
    });
  });

  it('decrypts a byok secret', async () => {
    const secretStore = createInMemoryCredentialSecretStore();
    const payload = encryptSecret('tenant-key', DEK);
    await secretStore.put({
      tenantId: 'tenant-1',
      providerCredentialId: 'cred-1',
      ...payload
    });

    const resolved = await resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'asr',
      credentials: [baseCredential()],
      secretStore,
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'platform-asr',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    });

    expect(resolved.mode).toBe('byok');
    expect(resolved.apiKey).toBe('tenant-key');
    expect(resolved.metadata.folderId).toBe('folder-1');
  });

  it('fails closed on disabled byok without platform fallback', async () => {
    const secretStore = createInMemoryCredentialSecretStore();
    await secretStore.put({
      tenantId: 'tenant-1',
      providerCredentialId: 'cred-1',
      ...encryptSecret('tenant-key', DEK)
    });

    await expect(resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'asr',
      credentials: [baseCredential({ status: 'disabled' })],
      secretStore,
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'platform-asr',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    })).rejects.toMatchObject({ code: 'SPEECH_CREDENTIAL_DISABLED' });
  });

  it('fails closed on decrypt error without platform fallback', async () => {
    const secretStore = createInMemoryCredentialSecretStore();
    await secretStore.put({
      tenantId: 'tenant-1',
      providerCredentialId: 'cred-1',
      ciphertext: Buffer.from('nope'),
      nonce: Buffer.alloc(12, 1),
      authTag: Buffer.alloc(16, 2)
    });

    await expect(resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'asr',
      credentials: [baseCredential()],
      secretStore,
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'platform-asr',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    })).rejects.toMatchObject({ code: 'SPEECH_CREDENTIAL_DECRYPT_FAILED' });
  });

  it('returns missing when platform env is empty', async () => {
    await expect(resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'llm',
      credentials: [],
      secretStore: createInMemoryCredentialSecretStore(),
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: '',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    })).rejects.toBeInstanceOf(SpeechCredentialResolveError);

    await expect(resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'llm',
      credentials: [],
      secretStore: createInMemoryCredentialSecretStore(),
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: '',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    })).rejects.toMatchObject({ code: 'SPEECH_CREDENTIAL_MISSING' });
  });

  it('returns invalid for inactive byok when requireActive is true', async () => {
    const secretStore = createInMemoryCredentialSecretStore();
    await secretStore.put({
      tenantId: 'tenant-1',
      providerCredentialId: 'cred-1',
      ...encryptSecret('tenant-key', DEK)
    });

    await expect(resolveSpeechCredential({
      tenantId: 'tenant-1',
      capability: 'asr',
      credentials: [baseCredential({ status: 'invalid' })],
      secretStore,
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'platform-asr',
        YANDEXGPT_API_KEY: '',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    })).rejects.toMatchObject({ code: 'SPEECH_CREDENTIAL_INVALID' });
  });
});
