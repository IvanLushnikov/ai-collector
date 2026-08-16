import { FastifyReply, FastifyRequest } from 'fastify';

type TenantSource = 'header' | 'path' | 'body';

export type TenantContext = {
  tenantId: string;
  source: TenantSource;
};

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext?: TenantContext;
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

export const tenantContextMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (request.url === '/' || request.url.startsWith('/healthz')) {
    return;
  }

  const headerTenantId = getHeaderTenantId(request);
  const pathTenantId = getPathTenantId(request);
  const bodyTenantId = getBodyTenantId(request);

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
