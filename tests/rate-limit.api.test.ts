import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

describe('Rate limiting middleware', () => {
  it('blocks requests after exceeding configured limit in a rolling window', async () => {
    const app = createApp({
      rateLimit: {
        maxRequests: 2,
        windowMs: 60000
      }
    });

    await app.ready();

    const first = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(second.statusCode).toBe(200);

    const blocked = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error).toBe('RATE_LIMIT_EXCEEDED');
    expect(blocked.json().limit).toBe(2);

    await app.close();
  });

  it('calls custom onLimitExceeded callback with request metadata', async () => {
    const onLimitExceeded = vi.fn();
    const app = createApp({
      rateLimit: {
        maxRequests: 1,
        windowMs: 60000,
        onLimitExceeded
      }
    });

    await app.ready();

    const first = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(first.statusCode).toBe(200);

    const blocked = await app.inject({
      method: 'GET',
      url: '/'
    });
    expect(blocked.statusCode).toBe(429);

    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
    expect(onLimitExceeded).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: null,
        requestPath: '/',
        method: 'GET',
        limit: 1,
        used: 2,
        windowMs: 60000,
        statusCode: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED'
      })
    );

    await app.close();
  });
});
