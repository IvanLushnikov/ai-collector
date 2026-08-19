import type { FastifyReply, FastifyRequest } from 'fastify';

export const CANONICAL_ROLES = [
  'tenant_owner',
  'campaign_manager',
  'tenant_viewer',
  'qa_analyst',
  'compliance_officer',
  'integration_admin',
  'platform_admin',
  'support_engineer'
] as const;

export type CanonicalRole = (typeof CANONICAL_ROLES)[number];

export type AccessZone =
  | 'campaigns'
  | 'calls'
  | 'reports'
  | 'integrations'
  | 'users'
  | 'audit_logs'
  | 'qa'
  | 'compliance';

type LegacyRole =
  | 'owner'
  | 'collection_manager'
  | 'operator'
  | 'qa_analyst'
  | 'compliance_officer'
  | 'integration_admin';

type RoleCandidate = CanonicalRole | LegacyRole;

type AccessLevel = 'none' | 'read' | 'write';

type ActorContext = {
  userId?: string;
  tenantId?: string;
  canonicalRole: CanonicalRole;
  source: 'auth' | 'header';
  supportGrant?: {
    id: string;
    tenantId: string;
    expiresAt: string | Date;
    revokedAt?: string | Date | null;
  } | null;
};

declare module 'fastify' {
  interface FastifyRequest {
    actor?: ActorContext;
  }
}

const legacyAliasMap: Record<LegacyRole, CanonicalRole> = {
  owner: 'tenant_owner',
  collection_manager: 'campaign_manager',
  operator: 'tenant_viewer',
  qa_analyst: 'qa_analyst',
  compliance_officer: 'compliance_officer',
  integration_admin: 'integration_admin'
};

const accessMatrix: Record<CanonicalRole, Record<AccessZone, AccessLevel>> = {
  tenant_owner: {
    campaigns: 'write',
    calls: 'write',
    reports: 'read',
    integrations: 'write',
    users: 'write',
    audit_logs: 'read',
    qa: 'write',
    compliance: 'write'
  },
  campaign_manager: {
    campaigns: 'write',
    calls: 'write',
    reports: 'read',
    integrations: 'read',
    users: 'none',
    audit_logs: 'read',
    qa: 'none',
    compliance: 'read'
  },
  tenant_viewer: {
    campaigns: 'read',
    calls: 'read',
    reports: 'read',
    integrations: 'none',
    users: 'none',
    audit_logs: 'read',
    qa: 'none',
    compliance: 'read'
  },
  qa_analyst: {
    campaigns: 'read',
    calls: 'read',
    reports: 'read',
    integrations: 'none',
    users: 'none',
    audit_logs: 'read',
    qa: 'write',
    compliance: 'read'
  },
  compliance_officer: {
    campaigns: 'read',
    calls: 'read',
    reports: 'read',
    integrations: 'none',
    users: 'none',
    audit_logs: 'read',
    qa: 'none',
    compliance: 'write'
  },
  integration_admin: {
    campaigns: 'read',
    calls: 'read',
    reports: 'read',
    integrations: 'write',
    users: 'none',
    audit_logs: 'read',
    qa: 'none',
    compliance: 'read'
  },
  platform_admin: {
    campaigns: 'none',
    calls: 'none',
    reports: 'none',
    integrations: 'none',
    users: 'none',
    audit_logs: 'none',
    qa: 'none',
    compliance: 'none'
  },
  support_engineer: {
    campaigns: 'none',
    calls: 'none',
    reports: 'none',
    integrations: 'none',
    users: 'none',
    audit_logs: 'none',
    qa: 'none',
    compliance: 'none'
  }
};

const lower = (value: string): string => value.trim().toLowerCase();

export const normalizeRole = (value: string): CanonicalRole | null => {
  const role = lower(value);
  if ((CANONICAL_ROLES as readonly string[]).includes(role)) {
    return role as CanonicalRole;
  }

  if (role in legacyAliasMap) {
    return legacyAliasMap[role as LegacyRole];
  }

  return null;
};

export const isCanonicalRole = (value: string): value is CanonicalRole =>
  (CANONICAL_ROLES as readonly string[]).includes(value);

export const canAccessZone = (
  role: CanonicalRole,
  zone: AccessZone,
  level: Exclude<AccessLevel, 'none'>
): boolean => {
  const granted = accessMatrix[role][zone];
  if (granted === 'none') {
    return false;
  }

  if (level === 'read') {
    return granted === 'read' || granted === 'write';
  }

  return granted === 'write';
};

export const allowLegacyRoles = (...roles: readonly RoleCandidate[]): readonly CanonicalRole[] =>
  roles
    .map((role) => normalizeRole(role))
    .filter((role): role is CanonicalRole => role !== null);

export const authorizeZone = (
  zone: AccessZone,
  level: Exclude<AccessLevel, 'none'>
) => async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  let actor = request.actor;
  if (!actor) {
    const roleHeader = request.headers['x-user-role'];
    const rawRole = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
    if (request.allowHeaderIdentity && typeof rawRole === 'string' && rawRole.trim()) {
      const canonicalRole = normalizeRole(rawRole);
      if (!canonicalRole) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'User role is not allowed for this endpoint'
        });
      }

      actor = {
        canonicalRole,
        source: 'header',
        tenantId: request.tenantContext?.tenantId,
        supportGrant: null
      };
      request.actor = actor;
      request.userRole = canonicalRole;
    }
  }

  if (!actor) {
    return reply.code(401).send({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });
  }

  if (actor.canonicalRole === 'support_engineer') {
    const grant = actor.supportGrant;
    const requestTenantId = request.tenantContext?.tenantId;
    const validGrant = Boolean(
      grant
      && requestTenantId
      && grant.tenantId === requestTenantId
      && grant.revokedAt == null
      && new Date(grant.expiresAt).getTime() > Date.now()
    );

    if (!validGrant) {
      return reply.code(403).send({
        error: 'SUPPORT_ACCESS_REQUIRED',
        message: 'Support access grant is required for tenant data access'
      });
    }
  }

  if (!canAccessZone(actor.canonicalRole, zone, level)) {
    return reply.code(403).send({
      error: 'FORBIDDEN',
      message: 'User role is not allowed for this endpoint'
    });
  }
};
