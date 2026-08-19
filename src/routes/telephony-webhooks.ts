import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  ingestProviderCallEvent,
  type IngestDeps
} from '../telephony/events/ingest.js';

type TelephonyWebhookDependencies = IngestDeps & {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  telephonyConnection: {
    findMany: (args: {
      where: { tenantId: string; provider: string; status: 'active' };
      select: { id: true; webhookSecretHash: true };
    }) => Promise<Array<{ id: string; webhookSecretHash: string | null }>>;
  };
};

const webhookParamsSchema = z.object({
  tenantId: z.string().min(1),
  sourceSystem: z.string().min(1)
});

const webhookSchema = z.object({
  eventId: z.string().min(1),
  providerCallId: z.string().min(1),
  status: z.string().min(1),
  occurredAt: z.string().datetime()
}).passthrough();

const secretsMatch = (provided: unknown, expectedHash: string): boolean => {
  if (
    typeof provided !== 'string'
    || provided.length === 0
    || !/^[0-9a-f]{64}$/i.test(expectedHash)
  ) {
    return false;
  }
  const providedHash = createHash('sha256').update(provided).digest();
  return timingSafeEqual(providedHash, Buffer.from(expectedHash, 'hex'));
};

export const registerTelephonyWebhookRoutes = (
  app: FastifyInstance,
  deps: TelephonyWebhookDependencies
): void => {
  app.post(
    '/tenants/:tenantId/telephony/webhooks/:sourceSystem',
    async (request, reply) => {
      const params = webhookParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: params.error.issues
        });
      }

      const connections = await deps.telephonyConnection.findMany({
        where: {
          tenantId: params.data.tenantId,
          provider: params.data.sourceSystem,
          status: 'active'
        },
        select: {
          id: true,
          webhookSecretHash: true
        }
      });
      const connection = connections.length === 1 ? connections[0] : undefined;
      if (!connection?.webhookSecretHash) {
        return reply.code(503).send({
          error: 'TELEPHONY_WEBHOOK_NOT_CONFIGURED'
        });
      }
      if (!secretsMatch(
        request.headers['x-telephony-webhook-secret'],
        connection.webhookSecretHash
      )) {
        return reply.code(401).send({
          error: 'INVALID_WEBHOOK_SECRET'
        });
      }

      const body = webhookSchema.safeParse(request.body ?? {});
      if (!body.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: body.error.issues
        });
      }

      const tenant = await deps.tenant.findUnique({
        where: { id: params.data.tenantId }
      });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const result = await ingestProviderCallEvent(deps, {
        tenantId: params.data.tenantId,
        sourceSystem: params.data.sourceSystem,
        eventId: body.data.eventId,
        providerCallId: body.data.providerCallId,
        rawStatus: body.data.status,
        occurredAt: new Date(body.data.occurredAt),
        payload: body.data
      });

      return reply.code(202).send({
        accepted: true,
        ...result
      });
    }
  );
};
