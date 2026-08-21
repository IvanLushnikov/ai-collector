import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/server/app.js';

const app = createApp();

describe('health endpoints', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /healthz returns ok without secret fields', async () => {
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = response.json();
    expect(body).toMatchObject({
      status: 'ok',
      service: 'ai-collector-backend'
    });
    expect(body).not.toHaveProperty('DATABASE_URL');
    expect(body).not.toHaveProperty('JWT_SECRET');
    expect(body).not.toHaveProperty('env');
  });

  it('GET /health and /health/live return ok', async () => {
    for (const url of ['/health', '/health/live']) {
      const response = await app.inject({ method: 'GET', url });
      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('ok');
    }
  });

  it('GET /health/ready returns ok or degraded without leaking internals', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect([200, 503]).toContain(response.statusCode);
    const body = response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks.database');
    expect(JSON.stringify(body)).not.toMatch(/postgres(ql)?:\/\//i);
  });
});
