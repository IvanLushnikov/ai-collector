import { describe, expect, it } from 'vitest';
import {
  SESSION_COOKIE_NAME,
  buildExpiredSessionCookie,
  buildSessionCookie,
  createSessionToken,
  parseCookieHeader
} from '../../src/auth/session-token.js';

describe('session token', () => {
  it('returns a raw token and a different hash', () => {
    const token = createSessionToken();
    expect(token.raw).toMatch(/^[a-f0-9]{64}$/);
    expect(token.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(token.tokenHash).not.toBe(token.raw);
  });

  it('parses the session cookie from a Cookie header', () => {
    const raw = 'abc123';
    const header = `${SESSION_COOKIE_NAME}=${raw}; other=1`;
    expect(parseCookieHeader(header, SESSION_COOKIE_NAME)).toBe(raw);
  });

  it('builds an httpOnly session cookie', () => {
    const cookie = buildSessionCookie('deadbeef', 3600);
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=deadbeef`);
    expect(cookie.toLowerCase()).toContain('httponly');
    expect(cookie.toLowerCase()).toContain('path=/');
  });

  it('builds an expired cookie for logout', () => {
    const cookie = buildExpiredSessionCookie();
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toMatch(/max-age=0/i);
  });
});
