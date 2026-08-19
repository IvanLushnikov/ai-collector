import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { roleMiddleware } from '../server/middleware/rbac.js';

type SupportAccessDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  supportAccessGrant?: {
    create?: (args: any) => Promise<unknown>;
    findFirst?: (args: any) => Promise<unknown>;
    update?: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
};

const createGrantSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().min(1),
  reason: z.string().trim().min(5),
  expiresAt: z.string().datetime()
});

const grantIdSchema = z.object({
  grantId: z.string().min(1)
});

export const registerSupportAccessRoutes = (
  app: FastifyInstance,
  deps: SupportAccessDependencies
): void => {
  app.post('/support/access-grants', { preValidation: roleMiddleware(['platform_admin']) }, async (request, reply) => {
    const payload = createGrantSchema.safeParse(request.body ?? {});
    if (!payload.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: payload.error.issues });
    }

    const tenant = await deps.tenant.findUnique({ where: { id: payload.data.tenantId } }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const grant = await deps.supportAccessGrant?.create?.({
      data: {
        tenantId: payload.data.tenantId,
        userId: payload.data.userId,
        grantedByUserId: request.authContext?.userId ?? 'platform-admin',
        reason: payload.data.reason,
        expiresAt: new Date(payload.data.expiresAt)
      }
    });

    if (!grant) {
      return reply.code(500).send({ error: 'SUPPORT_ACCESS_STORE_UNAVAILABLE' });
    }

    await deps.auditLog?.create?.({
      data: {
        tenantId: payload.data.tenantId,
        userId: request.authContext?.userId ?? payload.data.userId,
        action: 'support_access.granted',
        entityType: 'supportAccessGrant',
        entityId: (grant as { id: string }).id,
        metadata: {
          supportUserId: payload.data.userId,
          reason: payload.data.reason,
          expiresAt: payload.data.expiresAt
        }
      }
    });

    return reply.code(201).send(grant);
  });

  app.post('/support/access-grants/:grantId/revoke', { preValidation: roleMiddleware(['platform_admin']) }, async (request, reply) => {
    const params = grantIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
    }

    const existing = await deps.supportAccessGrant?.findFirst?.({
      where: { id: params.data.grantId }
    }) as { id: string; tenantId: string; userId: string } | null | undefined;

    if (!existing) {
      return reply.code(404).send({ error: 'SUPPORT_ACCESS_GRANT_NOT_FOUND' });
    }

    const revoked = await deps.supportAccessGrant?.update?.({
      where: { id: existing.id },
      data: { revokedAt: new Date() }
    });

    await deps.auditLog?.create?.({
      data: {
        tenantId: existing.tenantId,
        userId: request.authContext?.userId ?? existing.userId,
        action: 'support_access.revoked',
        entityType: 'supportAccessGrant',
        entityId: existing.id,
        metadata: {
          supportUserId: existing.userId
        }
      }
    });

    return reply.code(200).send(revoked ?? { id: existing.id, revokedAt: new Date().toISOString() });
  });
};
