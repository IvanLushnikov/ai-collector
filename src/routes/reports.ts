import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createCampaignReport } from '../reports/campaign-report.js';

type ReportDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<unknown>;
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
  };
};

const tenantCampaignReportSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid()
});

export const registerReportRoutes = (app: FastifyInstance, deps: ReportDependencies): void => {
  app.get('/tenants/:tenantId/campaigns/:campaignId/report', async (request, reply) => {
    const params = tenantCampaignReportSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const campaign = (await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    })) as { id: string; tenantId: string } | null;
    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const report = await createCampaignReport(deps, {
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId
    });

    return reply.code(200).send(report);
  });
};
