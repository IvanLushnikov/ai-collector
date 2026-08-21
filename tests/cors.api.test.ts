import { describe, expect, it } from 'vitest';
import { createApp } from '../src/server/app.js';

describe('CORS policy', () => {
  it('returns credentialed headers and completes a preflight request', async () => {
    const app = createApp({ campaignStore: {} });
    await app.ready();
    const response = await app.inject({ method: 'OPTIONS', url: '/auth/me', headers: { origin: 'http://localhost:5173' } });
    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    await app.close();
  });
});
