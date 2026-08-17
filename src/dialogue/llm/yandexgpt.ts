import { LlmAdapter, LlmTurnContext, LlmTurnResult } from './adapter.js';
import { YandexNotConfiguredError } from '../../speech/yandex/config.js';

export type YandexGptConfig = {
  apiKey?: string;
  folderId?: string;
};

export class YandexGptAdapter implements LlmAdapter {
  constructor(private readonly config: YandexGptConfig) {}

  async completeTurn(_context: LlmTurnContext): Promise<LlmTurnResult> {
    if (!this.config.apiKey || !this.config.folderId) {
      throw new YandexNotConfiguredError();
    }
    throw new YandexNotConfiguredError();
  }
}
