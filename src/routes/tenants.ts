import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env.js';
import { resolveActorId } from '../server/authz/actor.js';
import { authorizeZone } from '../server/authz/index.js';

type TenantBillingDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string; connectedMinuteRateRub: number | null } | null>;
    update: (args: { where: { id: string }; data: { connectedMinuteRateRub: number | null } }) => Promise<{ id: string; connectedMinuteRateRub: number | null }>;
  };
  user: {
    findFirst: (args: { where: { tenantId: string; isActive: boolean; status: string } }) => Promise<{ id: string } | null>;
  };
  auditLog?: {
    create: (args: {
      data: {
        tenantId: string;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }) => Promise<unknown>;
  };
};

const tenantSchema = z.object({
  tenantId: z.string().uuid()
});

const tenantBillingSettingsUpdateSchema = z.object({
  connectedMinuteRateRub: z.number().positive().or(z.null())
});

export const registerTenantRoutes = (app: FastifyInstance, deps: TenantBillingDependencies): void => {
  app.get('/tenants/:tenantId/billing/settings', { preValidation: authorizeZone('integrations', 'read') }, async (request, reply) => {
    const params = tenantSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    });
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    return reply.code(200).send({
      connectedMinuteRateRub: tenant.connectedMinuteRateRub,
      resolvedConnectedMinuteRateRub: tenant.connectedMinuteRateRub ?? env.BILLING_CONNECTED_MINUTE_RATE_RUB
    });
  });

  app.patch(
    '/tenants/:tenantId/billing/settings',
    { preValidation: authorizeZone('integrations', 'write') },
    async (request, reply) => {
      const params = tenantSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: params.error.issues
        });
      }

      const payload = tenantBillingSettingsUpdateSchema.safeParse(request.body ?? {});
      if (!payload.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: payload.error.issues
        });
      }

      const tenant = await deps.tenant.findUnique({
        where: { id: params.data.tenantId }
      });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      const updatedTenant = await deps.tenant.update({
        where: { id: params.data.tenantId },
        data: {
          connectedMinuteRateRub: payload.data.connectedMinuteRateRub
        }
      });

      await deps.auditLog?.create({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
          action: 'tenant.billing_settings_updated',
          entityType: 'tenant',
          entityId: params.data.tenantId,
          metadata: {
            previousConnectedMinuteRateRub: tenant.connectedMinuteRateRub,
            connectedMinuteRateRub: payload.data.connectedMinuteRateRub,
            sourceRoute: '/tenants/:tenantId/billing/settings'
          }
        }
      });

      return reply.code(200).send({
        id: updatedTenant.id,
        connectedMinuteRateRub: updatedTenant.connectedMinuteRateRub
      });
    }
  );
};
