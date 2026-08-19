import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'ac_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const createSessionToken = (): { raw: string; tokenHash: string } => {
  const raw = randomBytes(32).toString('hex');
  return {
    raw,
    tokenHash: hashSessionToken(raw)
  };
};

export const hashSessionToken = (raw: string): string => {
  return createHash('sha256').update(raw).digest('hex');
};

export const parseCookieHeader = (header: string | undefined, name: string): string | null => {
  if (!header) {
    return null;
  }
  const parts = header.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return rest.join('=') || null;
    }
  }
  return null;
};

export const buildSessionCookie = (raw: string, maxAgeSec: number = SESSION_TTL_SECONDS, secure = false): string => {
  return [
    `${SESSION_COOKIE_NAME}=${raw}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : [])
  ].join('; ');
};

export const buildExpiredSessionCookie = (secure = false): string => {
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : [])
  ].join('; ');
};
