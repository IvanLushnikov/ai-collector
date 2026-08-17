import { describe, expect, it } from 'vitest';
import { FakeAsrAdapter } from '../../src/speech/asr/fake.js';
import { createAsrAdapter } from '../../src/speech/asr/factory.js';
import { FakeTtsAdapter } from '../../src/speech/tts/fake.js';
import { createTtsAdapter } from '../../src/speech/tts/factory.js';
import { FakeLlmAdapter } from '../../src/dialogue/llm/fake.js';
import { createLlmAdapter } from '../../src/dialogue/llm/factory.js';
import { YandexAsrAdapter } from '../../src/speech/yandex/asr.js';
import type { ResolvedSpeechCredential } from '../../src/speech/credentials/resolve.js';

const credential = (overrides: Partial<ResolvedSpeechCredential> = {}): ResolvedSpeechCredential => ({
  tenantId: 'tenant-1',
  capability: 'asr',
  provider: 'yandex_speechkit',
  mode: 'byok',
  apiKey: 'AQVN',
  metadata: { folderId: 'folder' },
  ...overrides
});

describe('speech adapter factory', () => {
  it('builds fake adapters from a resolved credential without reading env', async () => {
    const asr = createAsrAdapter(credential(), { fake: true });
    const tts = createTtsAdapter(credential({ capability: 'tts' }), { fake: true });
    const llm = createLlmAdapter(credential({
      capability: 'llm',
      provider: 'yandexgpt'
    }), { fake: true });

    expect(asr).toBeInstanceOf(FakeAsrAdapter);
    expect(tts).toBeInstanceOf(FakeTtsAdapter);
    expect(llm).toBeInstanceOf(FakeLlmAdapter);
    expect(process.env.YANDEX_SPEECHKIT_API_KEY).not.toBe('AQVN');

    const result = await asr.transcribe({ audio: new Uint8Array([1]) });
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('builds a Yandex ASR adapter from the resolved apiKey, not process.env', () => {
    const asr = createAsrAdapter(credential());
    expect(asr).toBeInstanceOf(YandexAsrAdapter);
  });
});
