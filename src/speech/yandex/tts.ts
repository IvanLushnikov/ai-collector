import { TtsAdapter, TtsResult, TtsSynthesizeInput } from '../tts/adapter.js';
import { assertYandexConfigured, type YandexSpeechConfig } from './config.js';

export class YandexTtsAdapter implements TtsAdapter {
  constructor(private readonly config: YandexSpeechConfig) {}

  async synthesize(_input: TtsSynthesizeInput): Promise<TtsResult> {
    assertYandexConfigured(this.config);
    throw new Error('not configured');
  }
}
