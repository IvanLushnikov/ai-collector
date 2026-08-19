import type { FastifyReply, FastifyRequest } from 'fastify';

type CsrfOriginOptions = {
  enabled: boolean;
  allowedOrigins: readonly string[];
};

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const sessionEstablishingPaths = new Set(['/auth/login', '/auth/register']);

/**
 * Cookie sessions are browser credentials. In production, reject unsafe
 * requests unless the browser supplies an explicitly trusted Origin. API and
 * worker credentials do not create authContext and therefore use their own
 * authentication boundary rather than this browser-only control.
 */
export const createCsrfOriginMiddleware = ({ enabled, allowedOrigins }: CsrfOriginOptions) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const path = (request.url ?? '').split('?')[0];
    const createsSession = sessionEstablishingPaths.has(path);
    if (!enabled || !unsafeMethods.has(request.method) || (!request.authContext?.sessionId && !createsSession)) {
      return;
    }

    const origin = request.headers.origin;
    if (typeof origin !== 'string' || origin.length === 0) {
      return reply.code(403).send({
        error: 'CSRF_ORIGIN_REQUIRED',
        message: 'Origin header is required for cookie-authenticated mutations.'
      });
    }

    if (!allowedOrigins.includes(origin)) {
      return reply.code(403).send({
        error: 'CSRF_ORIGIN_FORBIDDEN',
        message: 'Origin is not trusted for cookie-authenticated mutations.'
      });
    }
  };
