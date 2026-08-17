import type { SpeechCapability, SpeechProvider } from '../../domain/provider-credential/index.js';

const ALLOWED: Record<SpeechCapability, readonly SpeechProvider[]> = {
  asr: ['yandex_speechkit'],
  tts: ['yandex_speechkit'],
  llm: ['yandexgpt', 'gigachat']
};

export const isSpeechProviderAllowed = (
  capability: SpeechCapability | string,
  provider: SpeechProvider | string
): boolean => {
  const allowed = ALLOWED[capability as SpeechCapability];
  if (!allowed) {
    return false;
  }
  return (allowed as readonly string[]).includes(provider);
};
