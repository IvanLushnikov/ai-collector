import { FastifyReply, FastifyRequest } from 'fastify';
import { resolveSessionFromRequest } from '../../routes/auth.js';
import { normalizeRole, type CanonicalRole } from '../authz/index.js';
import type { UserRole } from './rbac.js';

type AuthStore = {
  session?: {
    findFirst: (args: any) => Promise<unknown>;
  };
  user?: {
    findFirst: (args: any) => Promise<unknown>;
  };
  tenantMembership?: {
    findFirst?: (args: any) => Promise<unknown>;
  };
  platformMembership?: {
    findFirst?: (args: any) => Promise<unknown>;
  };
  supportAccessGrant?: {
    findFirst?: (args: any) => Promise<unknown>;
  };
};

type MembershipRoleRecord = {
  roleName?: string | null;
};

type UserWithRelations = {
  id: string;
  tenantId: string;
  role?: {
    name?: string | null;
  } | null;
};

declare module 'fastify' {
  interface FastifyRequest {
    authContext?: {
      userId: string;
      tenantId: string;
      role: CanonicalRole;
      sessionId: string;
      supportGrant?: {
        id: string;
        tenantId: string;
        expiresAt: string | Date;
        revokedAt?: string | Date | null;
      } | null;
    };
  }
}

const resolveCanonicalRole = async (
  deps: AuthStore,
  session: { userId: string; tenantId: string; roleName: string }
): Promise<CanonicalRole | null> => {
  const membership = await deps.tenantMembership?.findFirst?.({
    where: {
      userId: session.userId,
      tenantId: session.tenantId
    }
  }) as MembershipRoleRecord | null | undefined;

  if (membership?.roleName) {
    return normalizeRole(membership.roleName);
  }

  const user = await deps.user?.findFirst?.({
    where: { id: session.userId },
    include: { role: true }
  }) as UserWithRelations | null | undefined;

  const roleFromUser = user?.role?.name;
  if (roleFromUser) {
    return normalizeRole(roleFromUser);
  }

  const platformMembership = await deps.platformMembership?.findFirst?.({
    where: { userId: session.userId }
  }) as MembershipRoleRecord | null | undefined;

  if (platformMembership?.roleName) {
    return normalizeRole(platformMembership.roleName);
  }

  return normalizeRole(session.roleName);
};

export const authContextMiddleware = (deps: AuthStore) => {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!deps?.session?.findFirst) {
      return;
    }

    const session = await resolveSessionFromRequest(deps as any, request.headers.cookie);
    if (!session) {
      return;
    }

    const role = await resolveCanonicalRole(deps, session);
    if (!role) {
      return;
    }

    const supportGrant = await deps.supportAccessGrant?.findFirst?.({
      where: {
        userId: session.userId,
        revokedAt: null
      },
      orderBy: { expiresAt: 'desc' }
    }) as {
      id: string;
      tenantId: string;
      expiresAt: string | Date;
      revokedAt?: string | Date | null;
    } | null | undefined;

    request.authContext = {
      userId: session.userId,
      tenantId: session.tenantId,
      role,
      sessionId: session.id,
      supportGrant: supportGrant ?? null
    };
    request.tenantContext = {
      tenantId: session.tenantId,
      source: 'auth'
    };
    request.userRole = role as UserRole;
    request.actor = {
      userId: session.userId,
      tenantId: session.tenantId,
      canonicalRole: role,
      source: 'auth',
      supportGrant: supportGrant ?? null
    };
  };
};
