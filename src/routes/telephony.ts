import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { resolveActorId } from '../server/authz/actor.js';
import { authorizeZone } from '../server/authz/index.js';

type TelephonyDependencies = {
  $transaction?: <T>(callback: (transaction: Pick<TelephonyDependencies, 'telephonyConnection' | 'auditLog'>) => Promise<T>) => Promise<T>;
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  user: {
    findFirst: (args: { where: { tenantId: string; isActive: boolean; status: string } }) => Promise<unknown>;
  };
  telephonyConnection: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findUnique?: (args: { where: { id: string } }) => Promise<unknown>;
    update?: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
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
  campaign?: {
    findMany?: (args: {
      where: {
        tenantId: string;
        telephonyConnectionId: string;
        status: { in: string[] };
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

const telephonyConnectionParamsSchema = z.object({
  tenantId: z.string().uuid(),
  connectionId: z.string().uuid()
});

const telephonyConnectionSchema = z.object({
  provider: z.string().min(1),
  mode: z.enum(['sandbox', 'production']),
  status: z.enum(['active', 'disabled', 'invalid']).default('active'),
  displayName: z.string().min(1)
});

const telephonyConnectionUpdateSchema = z.object({
  provider: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  status: z.enum(['active', 'disabled', 'invalid']).optional()
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: 'At least one field is required'
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
    { preValidation: authorizeZone('integrations', 'read') },
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
    { preValidation: authorizeZone('integrations', 'write') },
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

    const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
    if (!actorId) {
      return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
    }

    const persistConnection = async (store: Pick<TelephonyDependencies, 'telephonyConnection' | 'auditLog'>) => {
      const connection = (await store.telephonyConnection.create({
        data: {
          tenantId: params.data.tenantId,
          provider: payload.data.provider,
          mode: payload.data.mode,
          status: payload.data.status,
          displayName: payload.data.displayName
        }
      })) as TelephonyConnectionRow;

      await store.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
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
      return connection;
    };
    const connection = deps.$transaction
      ? await deps.$transaction((transaction) => persistConnection(transaction))
      : await persistConnection(deps);

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

  app.patch(
    '/tenants/:tenantId/telephony-connections/:connectionId',
    { preValidation: authorizeZone('integrations', 'write') },
    async (request, reply) => {
      const params = telephonyConnectionParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: params.error.issues
        });
      }

      const payload = telephonyConnectionUpdateSchema.safeParse(request.body ?? {});
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

      const connection = await deps.telephonyConnection.findUnique?.({
        where: { id: params.data.connectionId }
      }) as TelephonyConnectionRow | null | undefined;

      if (!connection || connection.tenantId !== params.data.tenantId) {
        return reply.code(404).send({ error: 'TELEPHONY_CONNECTION_NOT_FOUND' });
      }

      const nextProvider = payload.data.provider;
      if (nextProvider && nextProvider !== connection.provider) {
        const lockedCampaigns = (await (deps.campaign?.findMany?.({
          where: {
            tenantId: params.data.tenantId,
            telephonyConnectionId: connection.id,
            status: { in: ['running', 'auto_paused'] }
          }
        }) ?? Promise.resolve([]))) as Array<{ id: string }>;

        if (lockedCampaigns.length > 0) {
          return reply.code(409).send({ error: 'TELEPHONY_PROVIDER_LOCKED' });
        }
      }

      const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      const persistUpdate = async (store: Pick<TelephonyDependencies, 'telephonyConnection' | 'auditLog'>) => {
        const updated = (await store.telephonyConnection.update?.({
          where: { id: connection.id },
          data: payload.data
        })) as TelephonyConnectionRow;

        await store.auditLog?.create?.({
          data: {
            tenantId: params.data.tenantId,
            userId: actorId,
            action: 'telephony_connection.updated',
            entityType: 'telephonyConnection',
            entityId: updated.id,
            metadata: {
              provider: updated.provider,
              mode: updated.mode,
              status: updated.status,
              sourceRoute: '/tenants/:tenantId/telephony-connections/:connectionId',
              tenantId: params.data.tenantId
            }
          }
        });
        return updated;
      };
      const updated = deps.$transaction
        ? await deps.$transaction((transaction) => persistUpdate(transaction))
        : await persistUpdate(deps);

      return reply.code(200).send({
        id: updated.id,
        tenantId: updated.tenantId,
        provider: updated.provider,
        mode: updated.mode,
        status: updated.status,
        displayName: updated.displayName,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      });
    }
  );
};
