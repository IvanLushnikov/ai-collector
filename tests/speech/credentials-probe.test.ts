import { describe, expect, it } from 'vitest';
import { fakeSpeechCredentialProbe } from '../../src/speech/credentials/fake-probe.js';

describe('fake speech credential probe', () => {
  it('returns ok for a non-empty key and allowlisted provider', async () => {
    await expect(fakeSpeechCredentialProbe.probe({
      apiKey: 'AQVN4242',
      provider: 'yandex_speechkit',
      capability: 'asr'
    })).resolves.toBe('ok');
  });

  it('returns failed for an empty key', async () => {
    await expect(fakeSpeechCredentialProbe.probe({
      apiKey: '  ',
      provider: 'yandex_speechkit',
      capability: 'asr'
    })).resolves.toBe('failed');
  });

  it('returns failed for an unknown provider without HTTP', async () => {
    await expect(fakeSpeechCredentialProbe.probe({
      apiKey: 'AQVN4242',
      provider: 'openai',
      capability: 'asr'
    })).resolves.toBe('failed');
  });
});
