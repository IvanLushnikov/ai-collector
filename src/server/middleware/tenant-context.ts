import { FastifyReply, FastifyRequest } from 'fastify';

type TenantSource = 'header' | 'path' | 'body' | 'auth';

export type TenantContext = {
  tenantId: string;
  source: TenantSource;
};

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext?: TenantContext;
    allowHeaderIdentity?: boolean;
  }
}

const getHeaderTenantId = (request: FastifyRequest): string | null => {
  const tenantHeader = request.headers['x-tenant-id'];

  if (typeof tenantHeader === 'string') {
    return tenantHeader || null;
  }
  if (Array.isArray(tenantHeader)) {
    return tenantHeader[0] || null;
  }
  return null;
};

const getPathTenantId = (request: FastifyRequest): string | null => {
  const params = request.params as { tenantId?: unknown } | undefined;
  if (typeof params?.tenantId === 'string') {
    return params.tenantId;
  }
  return null;
};

const getBodyTenantId = (request: FastifyRequest): string | null => {
  const body = request.body as { tenantId?: unknown } | undefined;
  if (typeof body?.tenantId === 'string') {
    return body.tenantId;
  }
  return null;
};

const isPublicOrServicePath = (path: string): boolean => {
  if (
    path === '/'
    || path.startsWith('/healthz')
    || path.startsWith('/health')
    || path.startsWith('/auth')
    || path.startsWith('/support')
    || path.startsWith('/openapi/')
  ) {
    return true;
  }

  // Provider callbacks authenticate via webhook secret, not cookie/header identity.
  // Pattern: /tenants/:tenantId/telephony/webhooks/:sourceSystem
  return /^\/tenants\/[^/]+\/telephony\/webhooks(?:\/|$)/.test(path);
};

export const tenantContextMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const path = request.url.split('?')[0] ?? request.url;
  if (isPublicOrServicePath(path)) {
    return;
  }

  const headerTenantId = getHeaderTenantId(request);
  const pathTenantId = getPathTenantId(request);
  const bodyTenantId = getBodyTenantId(request);
  const authTenantId = request.authContext?.tenantId ?? request.tenantContext?.tenantId ?? null;

  if (authTenantId) {
    const requestedTenantId = pathTenantId ?? bodyTenantId ?? headerTenantId;
    if (requestedTenantId && requestedTenantId !== authTenantId) {
      return reply.code(403).send({
        error: 'TENANT_SCOPE_MISMATCH',
        message: 'Authenticated tenant does not match request tenant scope.'
      });
    }

    request.tenantContext = {
      tenantId: authTenantId,
      source: 'auth'
    };
    return;
  }

  if (request.tenantContext) {
    return;
  }

  if (!request.allowHeaderIdentity) {
    return reply.code(401).send({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authenticated session or service identity is required.'
    });
  }

  if (headerTenantId) {
    request.tenantContext = {
      tenantId: headerTenantId,
      source: 'header'
    };
    return;
  }

  if (pathTenantId) {
    request.tenantContext = {
      tenantId: pathTenantId,
      source: 'path'
    };
    return;
  }

  if (bodyTenantId) {
    request.tenantContext = {
      tenantId: bodyTenantId,
      source: 'body'
    };
    return;
  }

  return reply.code(400).send({
    error: 'TENANT_CONTEXT_MISSING',
    message: 'Tenant context must be provided via X-Tenant-Id header, :tenantId path param, or request body tenantId.'
  });
};
