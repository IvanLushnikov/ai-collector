import { describe, expect, it } from 'vitest';
import { createCsrfOriginMiddleware } from '../../src/server/middleware/csrf-origin.js';

const reply = () => {
  const state = { statusCode: 200, body: undefined as unknown };
  return {
    state,
    code(statusCode: number) {
      state.statusCode = statusCode;
      return this;
    },
    send(body: unknown) {
      state.body = body;
      return this;
    }
  };
};

describe('CSRF origin middleware', () => {
  it('rejects unsafe cookie-session mutations without an Origin header', async () => {
    const middleware = createCsrfOriginMiddleware({ enabled: true, allowedOrigins: ['https://cabinet.example.test'] });
    const response = reply();

    await middleware({ method: 'POST', headers: {}, authContext: { sessionId: 'session-1' } } as any, response as any);

    expect(response.state).toEqual({
      statusCode: 403,
      body: { error: 'CSRF_ORIGIN_REQUIRED', message: 'Origin header is required for cookie-authenticated mutations.' }
    });
  });

  it('permits an unsafe cookie-session mutation only from a configured origin', async () => {
    const middleware = createCsrfOriginMiddleware({ enabled: true, allowedOrigins: ['https://cabinet.example.test'] });
    const allowed = reply();
    const denied = reply();

    await middleware({ method: 'PATCH', headers: { origin: 'https://cabinet.example.test' }, authContext: { sessionId: 'session-1' } } as any, allowed as any);
    await middleware({ method: 'PATCH', headers: { origin: 'https://evil.example.test' }, authContext: { sessionId: 'session-1' } } as any, denied as any);

    expect(allowed.state).toEqual({ statusCode: 200, body: undefined });
    expect(denied.state).toEqual({
      statusCode: 403,
      body: { error: 'CSRF_ORIGIN_FORBIDDEN', message: 'Origin is not trusted for cookie-authenticated mutations.' }
    });
  });

  it('does not impose an Origin requirement on safe or non-session requests', async () => {
    const middleware = createCsrfOriginMiddleware({ enabled: true, allowedOrigins: ['https://cabinet.example.test'] });
    const safe = reply();
    const service = reply();

    await middleware({ method: 'GET', headers: {}, authContext: { sessionId: 'session-1' } } as any, safe as any);
    await middleware({ method: 'POST', headers: {} } as any, service as any);

    expect(safe.state.statusCode).toBe(200);
    expect(service.state.statusCode).toBe(200);
  });

  it('also protects session-establishing auth endpoints from login CSRF', async () => {
    const middleware = createCsrfOriginMiddleware({ enabled: true, allowedOrigins: ['https://cabinet.example.test'] });
    const response = reply();

    await middleware({ method: 'POST', url: '/auth/login', headers: {} } as any, response as any);

    expect(response.state).toEqual({
      statusCode: 403,
      body: { error: 'CSRF_ORIGIN_REQUIRED', message: 'Origin header is required for cookie-authenticated mutations.' }
    });
  });
});
