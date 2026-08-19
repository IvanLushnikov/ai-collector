import { FastifyReply, FastifyRequest } from 'fastify';
import {
  allowLegacyRoles,
  normalizeRole,
  type CanonicalRole
} from '../authz/index.js';

export type UserRole = CanonicalRole;
type AllowedRole = CanonicalRole | 'owner' | 'collection_manager' | 'operator' | 'qa_analyst' | 'compliance_officer' | 'integration_admin';

declare module 'fastify' {
  interface FastifyRequest {
    userRole?: UserRole;
  }
}

export const roleMiddleware = (allowedRoles: readonly AllowedRole[]) => {
  const allowedRoleSet = new Set(allowLegacyRoles(...allowedRoles));

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const existingRole = request.userRole;
    const roleHeader = request.headers['x-user-role'];
    const rawRole = existingRole
      ?? (request.allowHeaderIdentity ? (Array.isArray(roleHeader) ? roleHeader[0] : roleHeader) : undefined);

    if (typeof rawRole !== 'string' || !rawRole.trim()) {
      return reply.code(401).send({
        error: 'USER_ROLE_MISSING',
        message: 'X-User-Role header is required'
      });
    }

    const role = normalizeRole(rawRole);
    if (!role) {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'User role is not allowed for this endpoint'
      });
    }

    request.userRole = role;
    request.actor ??= {
      canonicalRole: role,
      source: request.authContext ? 'auth' : 'header',
      userId: request.authContext?.userId,
      tenantId: request.authContext?.tenantId,
      supportGrant: request.authContext?.supportGrant ?? null
    };

    if (!allowedRoleSet.has(role)) {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'User role is not allowed for this endpoint'
      });
    }
  };
};
