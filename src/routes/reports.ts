import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createCampaignReport } from '../reports/campaign-report.js';
import { env } from '../config/env.js';
import { authorizeZone } from '../server/authz/index.js';

type ReportDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ 
      id: string;
      connectedMinuteRateRub: number | null;
    } | null>;
  };
  campaign: {
    findUnique: (args: { where: { id: string } }) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
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
        paymentOutcome?: string;
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
    { preValidation: authorizeZone('reports', 'read') },
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

    const report = await createCampaignReport(deps as any, {
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      billingRates: {
        connectedMinuteRateRub: resolvedConnectedMinuteRate
      }
    });

    return reply.code(200).send(report);
  });

  app.get(
    '/tenants/:tenantId/analytics/summary',
    { preValidation: authorizeZone('reports', 'read') },
    async (request, reply) => {
      const params = z.object({ tenantId: z.string().uuid() }).safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: params.error.issues
        });
      }

      const query = z.object({
        limit: z.coerce.number().int().min(1).max(100).default(20)
      }).safeParse(request.query);
      if (!query.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: query.error.issues
        });
      }

      const tenant = await deps.tenant.findUnique({
        where: { id: params.data.tenantId }
      });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const campaigns = ((await deps.campaign.findMany?.({
        where: { tenantId: params.data.tenantId },
        take: query.data.limit,
        orderBy: { createdAt: 'asc' },
        select: { id: true, tenantId: true, name: true }
      })) ?? []) as Array<{ id: string; tenantId: string; name: string }>;

      const reports = await Promise.all(campaigns.map(async (campaign) => {
        if (campaign.tenantId !== params.data.tenantId) {
          return null;
        }
        return createCampaignReport(deps as any, {
          tenantId: params.data.tenantId,
          campaignId: campaign.id,
          billingRates: {
            connectedMinuteRateRub: tenant.connectedMinuteRateRub ?? env.BILLING_CONNECTED_MINUTE_RATE_RUB
          }
        });
      }));

      const liveReports = reports.filter(Boolean) as Array<Awaited<ReturnType<typeof createCampaignReport>>>;
      const sum = (pick: (item: (typeof liveReports)[number]) => number) =>
        liveReports.reduce((total, item) => total + pick(item), 0);
      const costs = liveReports.map((item) => item.costPerCall).filter((value): value is number => value !== null);
      const ptpCosts = liveReports.map((item) => item.costPerPtp).filter((value): value is number => value !== null);

      return reply.code(200).send({
        tenantId: params.data.tenantId,
        campaignCount: liveReports.length,
        totalRecords: sum((item) => item.totalRecords),
        attemptedCalls: sum((item) => item.attemptedCalls),
        completedCalls: sum((item) => item.completedCalls),
        ptpCount: sum((item) => item.ptpCount),
        connectedMinutes: sum((item) => item.connectedMinutes),
        costPerCall: costs.length ? costs.reduce((a, b) => a + b, 0) : null,
        costPerPtp: ptpCosts.length ? ptpCosts.reduce((a, b) => a + b, 0) : null
      });
    }
  );
};
