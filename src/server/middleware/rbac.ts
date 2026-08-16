import { FastifyReply, FastifyRequest } from 'fastify';

export type UserRole = 'owner' | 'collection_manager' | 'operator' | 'qa_analyst' | 'compliance_officer' | 'integration_admin';

declare module 'fastify' {
  interface FastifyRequest {
    userRole?: UserRole;
  }
}

const normalizeRole = (value: string): string => value.trim().toLowerCase();

export const roleMiddleware = (allowedRoles: readonly UserRole[]) => {
  const allowedRoleSet = new Set(allowedRoles.map((role) => normalizeRole(role)));

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const roleHeader = request.headers['x-user-role'];
    const rawRole = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;

    if (typeof rawRole !== 'string' || !rawRole.trim()) {
      return reply.code(401).send({
        error: 'USER_ROLE_MISSING',
        message: 'X-User-Role header is required'
      });
    }

    const role = normalizeRole(rawRole) as UserRole;
    request.userRole = role;

    if (!allowedRoleSet.has(role)) {
      return reply.code(403).send({
        error: 'FORBIDDEN',
        message: 'User role is not allowed for this endpoint'
      });
    }
  };
};
