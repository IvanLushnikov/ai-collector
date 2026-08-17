import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  JWT_SECRET: z.string().default('change-me-in-secret-store'),
  CORS_ORIGINS: z.string().default('*'),
  BILLING_CONNECTED_MINUTE_RATE_RUB: z.coerce.number().positive('BILLING_CONNECTED_MINUTE_RATE_RUB must be a positive number').default(1.2),
  API_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive('API_RATE_LIMIT_MAX_REQUESTS must be a positive integer').default(120),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive('API_RATE_LIMIT_WINDOW_MS must be a positive integer').default(60000)
});

export const env = schema.parse(process.env);
