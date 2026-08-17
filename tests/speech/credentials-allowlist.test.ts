import { describe, expect, it } from 'vitest';
import { isSpeechProviderAllowed } from '../../src/speech/credentials/allowlist.js';

describe('speech provider allowlist', () => {
  it('allows SpeechKit for asr and tts', () => {
    expect(isSpeechProviderAllowed('asr', 'yandex_speechkit')).toBe(true);
    expect(isSpeechProviderAllowed('tts', 'yandex_speechkit')).toBe(true);
  });

  it('allows YandexGPT and GigaChat for llm', () => {
    expect(isSpeechProviderAllowed('llm', 'yandexgpt')).toBe(true);
    expect(isSpeechProviderAllowed('llm', 'gigachat')).toBe(true);
  });

  it('rejects foreign providers', () => {
    for (const provider of ['openai', 'anthropic', 'google', 'deepgram']) {
      expect(isSpeechProviderAllowed('asr', provider)).toBe(false);
      expect(isSpeechProviderAllowed('tts', provider)).toBe(false);
      expect(isSpeechProviderAllowed('llm', provider)).toBe(false);
    }
  });

  it('rejects SpeechKit as an llm provider', () => {
    expect(isSpeechProviderAllowed('llm', 'yandex_speechkit')).toBe(false);
  });
});
