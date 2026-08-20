import { describe, expect, it } from 'vitest';
import { isLiveCallsEnabled, parseEnv } from '../../src/config/env.js';

const required = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ai_collector'
};

const validDek = 'a'.repeat(64);

describe('LIVE_CALLS_ENABLED', () => {
  it('defaults live calls to disabled', () => {
    const parsed = parseEnv(required);

    expect(parsed.LIVE_CALLS_ENABLED).toBe(false);
    expect(isLiveCallsEnabled(parsed)).toBe(false);
  });

  it('enables live calls only for the true flag', () => {
    expect(parseEnv({ ...required, LIVE_CALLS_ENABLED: 'true' }).LIVE_CALLS_ENABLED).toBe(true);
    expect(parseEnv({ ...required, LIVE_CALLS_ENABLED: 'false' }).LIVE_CALLS_ENABLED).toBe(false);
  });

  it('rejects an invalid flag value instead of starting with live on', () => {
    expect(() => parseEnv({ ...required, LIVE_CALLS_ENABLED: 'yes' })).toThrow();
  });
});

describe('credentials and platform speech env', () => {
  it('does not start production without an encryption key', () => {
    expect(() => parseEnv({
      ...required,
      NODE_ENV: 'production'
    })).toThrow();
  });

  it('does not start production with a short encryption key', () => {
    expect(() => parseEnv({
      ...required,
      NODE_ENV: 'production',
      CREDENTIALS_ENCRYPTION_KEY: 'abcd'
    })).toThrow();
  });

  it('accepts a 32-byte hex encryption key in production', () => {
    const parsed = parseEnv({
      ...required,
      NODE_ENV: 'production',
      CREDENTIALS_ENCRYPTION_KEY: validDek,
      CORS_ORIGINS: 'https://cabinet.example.ru',
      JWT_SECRET: 'production-jwt-secret-at-least-32-chars'
    });
    expect(parsed.CREDENTIALS_ENCRYPTION_KEY).toBe(validDek);
  });

  it('does not allow wildcard CORS in production cookie session mode', () => {
    expect(() => parseEnv({
      ...required,
      NODE_ENV: 'production',
      CREDENTIALS_ENCRYPTION_KEY: validDek,
      CORS_ORIGINS: '*',
      JWT_SECRET: 'production-jwt-secret-at-least-32-chars'
    })).toThrow(/CORS_ORIGINS/);
  });

  it('rejects default JWT_SECRET in production', () => {
    expect(() => parseEnv({
      ...required,
      NODE_ENV: 'production',
      CREDENTIALS_ENCRYPTION_KEY: validDek,
      CORS_ORIGINS: 'https://cabinet.example.ru'
    })).toThrow(/JWT_SECRET/);
  });

  it('uses a test fixture when encryption key is omitted in test', () => {
    const parsed = parseEnv({
      ...required,
      NODE_ENV: 'test'
    });
    expect(parsed.CREDENTIALS_ENCRYPTION_KEY).toHaveLength(64);
  });

  it('defaults platform speech keys to empty strings', () => {
    const parsed = parseEnv(required);
    expect(parsed.YANDEX_SPEECHKIT_API_KEY).toBe('');
    expect(parsed.YANDEXGPT_API_KEY).toBe('');
    expect(parsed.GIGACHAT_API_KEY).toBe('');
    expect(parsed.YANDEX_FOLDER_ID).toBe('');
  });
});
