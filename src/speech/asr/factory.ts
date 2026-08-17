import type { AsrAdapter } from './adapter.js';
import { FakeAsrAdapter } from './fake.js';
import { YandexAsrAdapter } from '../yandex/asr.js';
import type { ResolvedSpeechCredential } from '../credentials/resolve.js';

export type SpeechAdapterFactoryOptions = {
  fake?: boolean;
};

export const createAsrAdapter = (
  credential: ResolvedSpeechCredential,
  options: SpeechAdapterFactoryOptions = {}
): AsrAdapter => {
  if (options.fake) {
    return new FakeAsrAdapter();
  }
  if (credential.provider !== 'yandex_speechkit') {
    throw new Error('PROVIDER_NOT_ALLOWED');
  }
  return new YandexAsrAdapter({
    apiKey: credential.apiKey,
    folderId: credential.metadata.folderId
  });
};
