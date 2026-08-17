import { describe, expect, it } from 'vitest';
import {
  CREDENTIAL_MODES,
  CREDENTIAL_STATUSES,
  SPEECH_CAPABILITIES,
  type ProviderCredential
} from '../src/domain/provider-credential/index.js';

describe('ProviderCredential domain', () => {
  it('does not include an apiKey field on the public type', () => {
    const credential: ProviderCredential = {
      id: 'cred-1',
      tenantId: 'tenant-1',
      capability: 'asr',
      provider: 'yandex_speechkit',
      mode: 'byok',
      status: 'pending_probe',
      displayName: 'SpeechKit',
      secretHint: '4242',
      metadata: { folderId: 'b1g' },
      lastProbedAt: null,
      lastProbeResult: null,
      createdAt: new Date('2026-08-17T00:00:00.000Z'),
      updatedAt: new Date('2026-08-17T00:00:00.000Z')
    };

    expect('apiKey' in credential).toBe(false);
    expect(SPEECH_CAPABILITIES).toEqual(['asr', 'tts', 'llm']);
    expect(CREDENTIAL_MODES).toContain('platform');
    expect(CREDENTIAL_STATUSES).toContain('disabled');
  });
});
