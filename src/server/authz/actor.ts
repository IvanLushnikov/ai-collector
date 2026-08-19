import type { FastifyRequest } from 'fastify';

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
