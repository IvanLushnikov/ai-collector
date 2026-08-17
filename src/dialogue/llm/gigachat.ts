import { LlmAdapter, LlmTurnContext, LlmTurnResult } from './adapter.js';

export class GigaChatNotConfiguredError extends Error {
  constructor() {
    super('not configured');
    this.name = 'GigaChatNotConfiguredError';
  }
}

export type GigaChatConfig = {
  apiKey?: string;
};

export class GigaChatAdapter implements LlmAdapter {
  constructor(private readonly config: GigaChatConfig) {}

  async completeTurn(_context: LlmTurnContext): Promise<LlmTurnResult> {
    if (!this.config.apiKey) {
      throw new GigaChatNotConfiguredError();
    }
    throw new GigaChatNotConfiguredError();
  }
}

