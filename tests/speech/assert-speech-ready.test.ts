import { describe, expect, it } from 'vitest';
import { createInMemoryCredentialSecretStore } from '../../src/secrets/credential-store.js';
import { parseDekHex } from '../../src/secrets/envelope.js';
import {
  areSpeechCredentialsReady,
  assertSpeechCredentialsReady,
  SpeechCredentialResolveError
} from '../../src/speech/credentials/assert-ready.js';

const DEK = parseDekHex('a'.repeat(64));
const emptyEnv = {
  YANDEX_SPEECHKIT_API_KEY: '',
  YANDEXGPT_API_KEY: '',
  GIGACHAT_API_KEY: '',
  YANDEX_FOLDER_ID: ''
};

describe('assertSpeechCredentialsReady', () => {
  it('fails closed with SPEECH_CREDENTIAL_MISSING when platform keys are absent', async () => {
    await expect(assertSpeechCredentialsReady({
      tenantId: 'tenant-1',
      credentials: [],
      secretStore: createInMemoryCredentialSecretStore(),
      dek: DEK,
      env: emptyEnv
    })).rejects.toBeInstanceOf(SpeechCredentialResolveError);

    await expect(assertSpeechCredentialsReady({
      tenantId: 'tenant-1',
      credentials: [],
      secretStore: createInMemoryCredentialSecretStore(),
      dek: DEK,
      env: emptyEnv
    })).rejects.toMatchObject({ code: 'SPEECH_CREDENTIAL_MISSING' });
  });

  it('resolves all three capabilities from platform env', async () => {
    const resolved = await assertSpeechCredentialsReady({
      tenantId: 'tenant-1',
      credentials: [],
      secretStore: createInMemoryCredentialSecretStore(),
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'sk',
        YANDEXGPT_API_KEY: 'gpt',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: 'folder'
      }
    });
    expect(resolved.map((row) => row.capability)).toEqual(['asr', 'tts', 'llm']);
  });

  it('treats sandbox/fake as ready without credentials', () => {
    expect(areSpeechCredentialsReady({
      tenantId: 'tenant-1',
      credentials: [],
      env: emptyEnv
    })).toBe(false);
  });
});
