import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createCampaignReport } from '../reports/campaign-report.js';
import { env } from '../config/env.js';
import { roleMiddleware } from '../server/middleware/rbac.js';

type ReportDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ 
      id: string;
      connectedMinuteRateRub: number | null;
    } | null>;
  };
  campaign: {
    findUnique: (args: { where: { id: string } }) => Promise<unknown>;
  };
  debtorRecord: {
    count: (args: { where: { tenantId: string; campaignId: string } }) => Promise<number>;
  };
  callAttempt: {
    count: (args: {
      where: {
        tenantId: string;
        campaignId: string;
        status?: string;
      };
    }) => Promise<number>;
  };
  callResult: {
    count: (args: {
      where: {
        tenantId: string;
        callAttempt: {
          campaignId: string;
        };
        outcome: string;
      };
    }) => Promise<number>;
  };
  complianceDecision: {
    count: (args: {
      where: {
        tenantId: string;
        campaignId: string;
        decision: string;
      };
    }) => Promise<number>;
  };
  usageEvent?: {
    count?: (args: {
      where: {
        tenantId: string;
        campaignId: string;
        eventType: string;
      };
    }) => Promise<number>;
    findMany?: (args: {
      where: { tenantId: string; campaignId: string };
      select: { sourceId: true; eventType: true; quantity: true; unit: true };
    }) => Promise<Array<{
      tenantId: string;
      campaignId: string;
      eventType: string;
      quantity: number;
      unit: string;
      sourceId: string;
    }>>;
  };
};

const tenantCampaignReportSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid()
});

export const registerReportRoutes = (app: FastifyInstance, deps: ReportDependencies): void => {
  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/report',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'operator', 'qa_analyst', 'compliance_officer', 'integration_admin']) },
    async (request, reply) => {
    const params = tenantCampaignReportSchema.safeParse(request.params);
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

    const resolvedConnectedMinuteRate = tenant.connectedMinuteRateRub ?? env.BILLING_CONNECTED_MINUTE_RATE_RUB;

    const campaign = (await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    })) as { id: string; tenantId: string } | null;
    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const report = await createCampaignReport(deps, {
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      billingRates: {
        connectedMinuteRateRub: resolvedConnectedMinuteRate
      }
    });

    return reply.code(200).send(report);
  });
};
