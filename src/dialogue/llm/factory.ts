import type { LlmAdapter } from './adapter.js';
import { FakeLlmAdapter } from './fake.js';
import { YandexGptAdapter } from './yandexgpt.js';
import { GigaChatAdapter } from './gigachat.js';
import type { ResolvedSpeechCredential } from '../../speech/credentials/resolve.js';
import type { SpeechAdapterFactoryOptions } from '../../speech/asr/factory.js';

export const createLlmAdapter = (
  credential: ResolvedSpeechCredential,
  options: SpeechAdapterFactoryOptions = {}
): LlmAdapter => {
  if (options.fake) {
    return new FakeLlmAdapter();
  }
  if (credential.provider === 'yandexgpt') {
    return new YandexGptAdapter({
      apiKey: credential.apiKey,
      folderId: credential.metadata.folderId
    });
  }
  if (credential.provider === 'gigachat') {
    return new GigaChatAdapter({ apiKey: credential.apiKey });
  }
  throw new Error('PROVIDER_NOT_ALLOWED');
};
