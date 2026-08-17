export class YandexNotConfiguredError extends Error {
  constructor() {
    super('not configured');
    this.name = 'YandexNotConfiguredError';
  }
}

export type YandexSpeechConfig = {
  apiKey?: string;
  folderId?: string;
};

export const assertYandexConfigured = (config: YandexSpeechConfig): void => {
  if (!config.apiKey || !config.folderId) {
    throw new YandexNotConfiguredError();
  }
};
