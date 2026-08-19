import { FastifyReply, FastifyRequest } from 'fastify';

type RateLimitRecord = {
  windowStart: number;
  requestCount: number;
};

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  errorCode?: string;
  statusCode?: number;
  onLimitExceeded?: (payload: {
    tenantId: string | null;
    requestPath: string;
    requestId: string;
    method: string;
    ip: string;
    limit: number;
    used: number;
    windowMs: number;
    resetAt: string;
    statusCode: number;
    errorCode: string;
  }) => Promise<void> | void;
};

const DEFAULT_ERROR_CODE = 'RATE_LIMIT_EXCEEDED';
const DEFAULT_STATUS_CODE = 429;

const resolveTenantId = (request: FastifyRequest): string | null => {
  if (request.tenantContext?.tenantId) {
    return request.tenantContext.tenantId;
  }
  const tenantHeader = request.headers['x-tenant-id'];
  if (typeof tenantHeader === 'string' && tenantHeader.length > 0) {
    return tenantHeader;
  }
  if (Array.isArray(tenantHeader) && tenantHeader.length > 0 && tenantHeader[0].length > 0) {
    return tenantHeader[0];
  }

  const params = request.params as { tenantId?: unknown } | undefined;
  if (typeof params?.tenantId === 'string' && params.tenantId.length > 0) {
    return params.tenantId;
  }

  const body = request.body as { tenantId?: unknown } | undefined;
  if (typeof body?.tenantId === 'string' && body.tenantId.length > 0) {
    return body.tenantId;
  }

  return null;
};

export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const rateLimitState = new Map<string, RateLimitRecord>();
  const limit = Math.max(1, Math.floor(config.maxRequests));
  const windowMs = Math.max(1000, Math.floor(config.windowMs));
  const errorCode = config.errorCode ?? DEFAULT_ERROR_CODE;
  const statusCode = config.statusCode ?? DEFAULT_STATUS_CODE;

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const key = request.ip;
    const tenantId = resolveTenantId(request);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;

    const current = rateLimitState.get(key);
    if (!current || current.windowStart !== windowStart) {
      rateLimitState.set(key, {
        windowStart,
        requestCount: 1
      });
      return;
    }

    current.requestCount += 1;
    if (current.requestCount > limit) {
      const resetAt = new Date(windowStart + windowMs).toISOString();
      const requestId = typeof request.id === 'string' ? request.id : '';
      const requestPath = request.url ?? request.routeOptions?.url ?? '/';

      if (typeof config.onLimitExceeded === 'function') {
        await config.onLimitExceeded({
          tenantId,
          requestPath,
          requestId,
          method: request.method,
          ip: request.ip,
          limit,
          used: current.requestCount,
          windowMs,
          resetAt,
          statusCode,
          errorCode
        });
      }

      reply.code(statusCode).send({
        error: errorCode,
        limit,
        used: current.requestCount,
        windowMs,
        resetAt
      });
      return;
    }
  };
};
