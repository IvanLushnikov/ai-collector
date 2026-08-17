import type { TtsAdapter } from './adapter.js';
import { FakeTtsAdapter } from './fake.js';
import { YandexTtsAdapter } from '../yandex/tts.js';
import type { ResolvedSpeechCredential } from '../credentials/resolve.js';
import type { SpeechAdapterFactoryOptions } from '../asr/factory.js';

export const createTtsAdapter = (
  credential: ResolvedSpeechCredential,
  options: SpeechAdapterFactoryOptions = {}
): TtsAdapter => {
  if (options.fake) {
    return new FakeTtsAdapter();
  }
  if (credential.provider !== 'yandex_speechkit') {
    throw new Error('PROVIDER_NOT_ALLOWED');
  }
  return new YandexTtsAdapter({
    apiKey: credential.apiKey,
    folderId: credential.metadata.folderId
  });
};
