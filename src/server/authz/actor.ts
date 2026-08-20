import type { FastifyRequest } from 'fastify';

export type AuditActorType = 'user' | 'system';

export type AuditActorMetadata = {
  actorType: AuditActorType;
  actorRole?: string;
};

type UserStore = {
  findFirst: (args: any) => Promise<unknown>;
};

export const resolveActorId = async (
  request: FastifyRequest,
  userStore: UserStore,
  tenantId: string
): Promise<string | null> => {
  if (request.authContext?.userId && request.authContext.tenantId === tenantId) {
    return request.authContext.userId;
  }

  const actor = await userStore.findFirst({
    where: {
      tenantId,
      isActive: true,
      status: 'active'
    }
  }) as { id: string } | null;

  return actor?.id ?? null;
};

export const resolveAuditActorMetadata = (
  request: FastifyRequest,
  actorType: AuditActorType = 'user'
): AuditActorMetadata => {
  if (actorType === 'system') {
    return { actorType: 'system' };
  }

  const role =
    request.userRole
    ?? request.actor?.canonicalRole
    ?? request.authContext?.role;

  return role
    ? { actorType: 'user', actorRole: role }
    : { actorType: 'user' };
};
