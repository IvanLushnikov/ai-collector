import { describe, expect, it } from 'vitest';
import { YandexAsrAdapter } from '../../src/speech/yandex/asr.js';
import { YandexTtsAdapter } from '../../src/speech/yandex/tts.js';
import { YandexNotConfiguredError } from '../../src/speech/yandex/config.js';
import { YandexGptAdapter } from '../../src/dialogue/llm/yandexgpt.js';

describe('Yandex speech/LLM skeletons', () => {
  it('returns a controlled not configured error without network calls', async () => {
    const asr = new YandexAsrAdapter({ apiKey: '', folderId: '' });
    const tts = new YandexTtsAdapter({});
    const llm = new YandexGptAdapter({});

    await expect(asr.transcribe({ audio: new Uint8Array() })).rejects.toBeInstanceOf(YandexNotConfiguredError);
    await expect(tts.synthesize({
      text: 'тест',
      voiceId: 'alena',
      voiceVersion: 'v1'
    })).rejects.toBeInstanceOf(YandexNotConfiguredError);
    await expect(llm.completeTurn({
      stateId: 'identity',
      identityVerified: false,
      userText: 'алло',
      allowedTools: ['end_call']
    })).rejects.toBeInstanceOf(YandexNotConfiguredError);
  });
});
