import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UsageLedgerItem } from '../domain/usage-event/index.js';
import type { UsageEventType } from '../domain/usage-event/index.js';
import { calculateUsageLedgerTotals } from '../domain/usage-ledger/index.js';

type UsageDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<unknown>;
  };
  campaign: {
    findUnique: (args: { where: { id: string } }) => Promise<unknown>;
  };
  usageEvent?: {
    findMany?: (args: {
      where: { tenantId: string; campaignId: string };
      orderBy?: { occurredAt: 'asc' | 'desc' };
      select?: {
        id?: true;
        eventType?: true;
        quantity?: true;
        unit?: true;
        occurredAt?: true;
        sourceId?: true;
      };
    }) => Promise<unknown>;
  };
};

type UsageEventListRaw = {
  eventType: UsageEventType;
  quantity: number;
  unit: string;
  occurredAt: string | Date;
};

const tenantCampaignUsageSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid()
});

type UsageEventTotalsRecord = {
  sourceId: string;
  eventType: UsageEventType;
  quantity: number;
  unit: string;
};

export const registerUsageRoutes = (app: FastifyInstance, deps: UsageDependencies): void => {
  const verifyTenantCampaignScope = async (
    tenantId: string,
    campaignId: string
  ): Promise<'tenant_not_found' | 'campaign_not_found' | 'ok'> => {
    const tenant = (await deps.tenant.findUnique({
      where: { id: tenantId }
    })) as { id: string } | null;
    if (!tenant) {
      return 'tenant_not_found';
    }

    const campaign = (await deps.campaign.findUnique({
      where: { id: campaignId }
    })) as { id: string; tenantId: string } | null;
    if (!campaign || campaign.tenantId !== tenantId) {
      return 'campaign_not_found';
    }

    return 'ok';
  };

  app.get('/tenants/:tenantId/campaigns/:campaignId/usage-events', async (request, reply) => {
    const params = tenantCampaignUsageSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const scope = await verifyTenantCampaignScope(params.data.tenantId, params.data.campaignId);
    if (scope === 'tenant_not_found') {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }
    if (scope === 'campaign_not_found') {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const usageEvents =
      ((await deps.usageEvent?.findMany?.({
        where: {
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId
        },
        orderBy: {
          occurredAt: 'asc'
        },
        select: {
          eventType: true,
          quantity: true,
          unit: true,
          occurredAt: true
        }
      })) as Array<UsageEventListRaw> | undefined) ?? [];

    const mappedEvents = usageEvents.map((event) => ({
      eventType: event.eventType,
      quantity: event.quantity,
      unit: event.unit,
      occurredAt: event.occurredAt
    }) as UsageLedgerItem);

    return reply.code(200).send(mappedEvents);
  });

  app.get('/tenants/:tenantId/campaigns/:campaignId/usage-events/totals', async (request, reply) => {
    const params = tenantCampaignUsageSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const scope = await verifyTenantCampaignScope(params.data.tenantId, params.data.campaignId);
    if (scope === 'tenant_not_found') {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }
    if (scope === 'campaign_not_found') {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const usageEventStore = deps.usageEvent?.findMany;
    if (!usageEventStore) {
      return reply.code(500).send({
        error: 'USAGE_EVENT_STORE_UNAVAILABLE'
      });
    }

    const totalsResult = await calculateUsageLedgerTotals(
      {
        usageEvent: {
          findMany: async (query) => usageEventStore(query as never) as Promise<Array<UsageEventTotalsRecord>>
        }
      },
      {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId
      }
    );

    return reply.code(200).send(totalsResult.totals);
  });
};
