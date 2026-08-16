import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { roleMiddleware } from '../server/middleware/rbac.js';

type TelephonyDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  user: {
    findFirst: (args: { where: { tenantId: string; isActive: boolean; status: string } }) => Promise<unknown>;
  };
  telephonyConnection: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findMany?: (args: {
      where: { tenantId: string };
      orderBy?: { createdAt: 'asc' | 'desc' };
      select?: {
        id?: boolean;
        provider?: boolean;
        mode?: boolean;
        status?: boolean;
        displayName?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
      };
    }) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
};

const tenantSchema = z.object({
  tenantId: z.string().uuid()
});

const telephonyConnectionSchema = z.object({
  provider: z.string().min(1),
  mode: z.enum(['sandbox', 'production']),
  status: z.enum(['active', 'disabled', 'invalid']).default('active'),
  displayName: z.string().min(1)
});

type TelephonyConnectionRow = {
  id: string;
  tenantId: string;
  provider: string;
  mode: string;
  status: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export const registerTelephonyRoutes = (app: FastifyInstance, deps: TelephonyDependencies): void => {
  app.get(
    '/tenants/:tenantId/telephony-connections',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'integration_admin']) },
    async (request, reply) => {
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

    const rawConnections = await deps.telephonyConnection.findMany?.({
      where: { tenantId: params.data.tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        provider: true,
        mode: true,
        status: true,
        displayName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const connections = (rawConnections ?? []) as Array<TelephonyConnectionRow>;

    return reply.code(200).send(
      connections.map((connection) => ({
        id: connection.id,
        provider: connection.provider,
        mode: connection.mode,
        status: connection.status,
        displayName: connection.displayName,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      }))
    );
  });

  app.post(
    '/tenants/:tenantId/telephony-connections',
    { preValidation: roleMiddleware(['owner', 'integration_admin']) },
    async (request, reply) => {
    const params = tenantSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const payload = telephonyConnectionSchema.safeParse(request.body ?? {});
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

    const actor = await deps.user.findFirst({
      where: {
        tenantId: params.data.tenantId,
        isActive: true,
        status: 'active'
      }
    }) as { id: string } | null;
    if (!actor) {
      return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
    }

    const connection = (await (deps.telephonyConnection.create({
      data: {
        tenantId: params.data.tenantId,
        provider: payload.data.provider,
        mode: payload.data.mode,
        status: payload.data.status,
        displayName: payload.data.displayName
      }
    }))) as TelephonyConnectionRow;

    await deps.auditLog?.create?.({
      data: {
        tenantId: params.data.tenantId,
        userId: actor.id,
        action: 'telephony_connection.created',
        entityType: 'telephonyConnection',
        entityId: connection.id,
        metadata: {
          provider: connection.provider,
          mode: connection.mode,
          status: connection.status,
          sourceRoute: '/tenants/:tenantId/telephony-connections',
          tenantId: params.data.tenantId
        }
      }
    });

    return reply.code(201).send({
      id: connection.id,
      tenantId: connection.tenantId,
      provider: connection.provider,
      mode: connection.mode,
      status: connection.status,
      displayName: connection.displayName,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt
    });
  });
};
