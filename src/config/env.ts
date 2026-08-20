import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

export const TEST_CREDENTIALS_ENCRYPTION_KEY = 'a'.repeat(64);

const hex32 = z.string().regex(/^[0-9a-fA-F]{64}$/, 'CREDENTIALS_ENCRYPTION_KEY must be 32 bytes hex');

const DEFAULT_JWT_SECRET = 'change-me-in-secret-store';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  JWT_SECRET: z.string().default(DEFAULT_JWT_SECRET),
  // When true, Fastify trusts X-Forwarded-* from the reverse proxy (required behind Caddy/nginx).
  TRUST_PROXY: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  CORS_ORIGINS: z.string().default('*'),
  BILLING_CONNECTED_MINUTE_RATE_RUB: z.coerce.number().positive('BILLING_CONNECTED_MINUTE_RATE_RUB must be a positive number').default(1.2),
  API_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive('API_RATE_LIMIT_MAX_REQUESTS must be a positive integer').default(120),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive('API_RATE_LIMIT_WINDOW_MS must be a positive integer').default(60000),
  LIVE_CALLS_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  SANDBOX_CALLS_QUEUE_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  CREDENTIALS_ENCRYPTION_KEY: z.string().optional(),
  YANDEX_SPEECHKIT_API_KEY: z.string().optional().default(''),
  YANDEXGPT_API_KEY: z.string().optional().default(''),
  GIGACHAT_API_KEY: z.string().optional().default(''),
  YANDEX_FOLDER_ID: z.string().optional().default('')
}).superRefine((value, ctx) => {
  if (value.NODE_ENV === 'production') {
    const parsed = hex32.safeParse(value.CREDENTIALS_ENCRYPTION_KEY ?? '');
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CREDENTIALS_ENCRYPTION_KEY'],
        message: 'CREDENTIALS_ENCRYPTION_KEY is required in production (32-byte hex)'
      });
    }
    if (value.CORS_ORIGINS.trim() === '*' || value.CORS_ORIGINS.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list explicit trusted origins in production'
      });
    }
    if (value.JWT_SECRET === DEFAULT_JWT_SECRET || value.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be a unique secret at least 32 characters in production'
      });
    }
    return;
  }

  if (value.CREDENTIALS_ENCRYPTION_KEY && value.CREDENTIALS_ENCRYPTION_KEY.length > 0) {
    const parsed = hex32.safeParse(value.CREDENTIALS_ENCRYPTION_KEY);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CREDENTIALS_ENCRYPTION_KEY'],
        message: 'CREDENTIALS_ENCRYPTION_KEY must be 32 bytes hex'
      });
    }
  }
}).transform((value) => ({
  ...value,
  CREDENTIALS_ENCRYPTION_KEY: value.CREDENTIALS_ENCRYPTION_KEY
    && value.CREDENTIALS_ENCRYPTION_KEY.length > 0
    ? value.CREDENTIALS_ENCRYPTION_KEY
    : value.NODE_ENV === 'test'
      ? TEST_CREDENTIALS_ENCRYPTION_KEY
      : value.CREDENTIALS_ENCRYPTION_KEY ?? ''
}));

export type AppEnv = z.infer<typeof envSchema>;

export const parseEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv => envSchema.parse(source);

export const env = parseEnv();

export const isLiveCallsEnabled = (config: Pick<AppEnv, 'LIVE_CALLS_ENABLED'> = env): boolean =>
  config.LIVE_CALLS_ENABLED === true;
