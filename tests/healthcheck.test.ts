import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/server/app.js';

const app = createApp();

describe('GET /healthz', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok status payload', async () => {
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = response.json();
    expect(body).toMatchObject({
      status: 'ok',
      service: 'ai-collector-backend'
    });
    expect(body.env).toBeTypeOf('string');
  });
});
