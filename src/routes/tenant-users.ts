import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resolveActorId } from '../server/authz/actor.js';
import { authorizeZone } from '../server/authz/index.js';

type TenantUsersDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  user: {
    findFirst?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
  };
  role?: {
    findFirst?: (args: any) => Promise<unknown>;
  };
  tenantMembership?: {
    findMany?: (args: any) => Promise<unknown>;
    findFirst?: (args: any) => Promise<unknown>;
    create?: (args: any) => Promise<unknown>;
    update?: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
};

const tenantSchema = z.object({
  tenantId: z.string().uuid()
});

const tenantUserSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().min(1)
});

const updateRoleSchema = z.object({
  role: z.enum(['tenant_owner', 'campaign_manager', 'tenant_viewer'])
});

export const registerTenantUserRoutes = (
  app: FastifyInstance,
  deps: TenantUsersDependencies
): void => {
  app.get(
    '/tenants/:tenantId/users',
    { preValidation: authorizeZone('users', 'read') },
    async (request, reply) => {
      const params = tenantSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } }) as { id: string } | null;
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const rows = (await deps.tenantMembership?.findMany?.({
        where: { tenantId: params.data.tenantId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }) ?? Promise.resolve([])) as Array<{
        userId: string;
        roleName: string;
        user?: {
          id: string;
          name: string;
          email: string;
          status: string;
          isActive: boolean;
        } | null;
      }>;

      return reply.code(200).send(rows.map((row) => ({
        userId: row.userId,
        role: row.roleName,
        user: row.user ?? null
      })));
    }
  );

  app.patch(
    '/tenants/:tenantId/users/:userId/role',
    { preValidation: authorizeZone('users', 'write') },
    async (request, reply) => {
      const params = tenantUserSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const payload = updateRoleSchema.safeParse(request.body ?? {});
      if (!payload.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: payload.error.issues });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } }) as { id: string } | null;
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const actorId = await resolveActorId(request, deps.user as { findFirst: (args: any) => Promise<unknown> }, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      const membership = await deps.tenantMembership?.findFirst?.({
        where: {
          tenantId: params.data.tenantId,
          userId: params.data.userId
        }
      }) as { id: string; roleName: string } | null | undefined;

      const result = membership
        ? await deps.tenantMembership?.update?.({
            where: { id: membership.id },
            data: { roleName: payload.data.role }
          })
        : await deps.tenantMembership?.create?.({
            data: {
              tenantId: params.data.tenantId,
              userId: params.data.userId,
              roleName: payload.data.role
            }
          });

      if (!result) {
        return reply.code(500).send({ error: 'TENANT_MEMBERSHIP_STORE_UNAVAILABLE' });
      }

      await deps.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
          action: membership ? 'tenant_user.role_updated' : 'tenant_user.membership_added',
          entityType: 'tenantMembership',
          entityId: (result as { id: string }).id,
          metadata: {
            targetUserId: params.data.userId,
            previousRole: membership?.roleName ?? null,
            role: payload.data.role
          }
        }
      });

      return reply.code(200).send({
        userId: params.data.userId,
        role: (result as { roleName: string }).roleName
      });
    }
  );
};
