import { AsrAdapter, AsrResult, AsrTranscribeInput } from '../asr/adapter.js';
import { assertYandexConfigured, type YandexSpeechConfig } from './config.js';

export class YandexAsrAdapter implements AsrAdapter {
  constructor(private readonly config: YandexSpeechConfig) {}

  async transcribe(_input: AsrTranscribeInput): Promise<AsrResult> {
    assertYandexConfigured(this.config);
    throw new Error('not configured');
  }
}
