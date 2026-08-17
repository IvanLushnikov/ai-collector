import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ComplianceEngine } from '../compliance/engine/compliance-engine.js';
import { CallWindowComplianceRule } from '../compliance/rules/call-window.js';
import { ConsentStatusRule } from '../compliance/rules/consent-status.js';
import { DebtStatusRule } from '../compliance/rules/debt-status.js';
import { roleMiddleware } from '../server/middleware/rbac.js';

type ComplianceDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  debtorRecord: {
    findUnique: (args: any) => Promise<unknown>;
  };
  complianceDecision?: {
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
  };
  complianceEngine?: ComplianceEngine;
};

const tenantCampaignDebtorComplianceSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid(),
  debtorRecordId: z.string().uuid()
});

const tenantCampaignComplianceDecisionsSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid()
});

const tenantCampaignComplianceDecisionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
  decision: z.enum(['allow', 'block']).optional()
});

const complianceRouteRoles = [
  'owner',
  'collection_manager',
  'operator',
  'qa_analyst',
  'compliance_officer',
  'integration_admin'
] as const;

const createEngine = (deps: ComplianceDependencies): ComplianceEngine => {
  if (deps.complianceEngine) {
    return deps.complianceEngine;
  }

  return new ComplianceEngine(
    [
      new CallWindowComplianceRule(),
      new ConsentStatusRule(),
      new DebtStatusRule()
    ],
    {
      ruleVersion: 'v1',
      complianceDecisionStore: deps.complianceDecision?.create
        ? {
            create: (args: {
              data: {
                tenantId: string;
                campaignId: string;
                debtorRecordId: string;
                decision: string;
                reasonCode: string;
                reasonText: string;
                ruleVersion: string;
                checkedAt: Date;
              };
            }) => deps.complianceDecision!.create!(args)
          }
        : undefined
    }
  );
};

const verifyTenantCampaignScope = async (
  deps: ComplianceDependencies,
  tenantId: string,
  campaignId: string
): Promise<'tenant_not_found' | 'campaign_not_found' | 'ok'> => {
  const tenant = await deps.tenant.findUnique({
    where: { id: tenantId }
  }) as { id: string } | null;
  if (!tenant) {
    return 'tenant_not_found';
  }

  const campaign = await deps.campaign.findUnique({
    where: { id: campaignId }
  }) as { id: string; tenantId: string } | null;
  if (!campaign || campaign.tenantId !== tenantId) {
    return 'campaign_not_found';
  }

  return 'ok';
};

type ComplianceDecisionListRaw = {
  id: string;
  tenantId: string;
  campaignId: string;
  debtorRecordId: string;
  decision: string;
  reasonCode: string;
  reasonText: string;
  ruleVersion: string;
  checkedAt: string | Date;
};

export const registerComplianceRoutes = (app: FastifyInstance, deps: ComplianceDependencies): void => {
  app.post(
    '/tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check',
    { preValidation: roleMiddleware(complianceRouteRoles) },
    async (request, reply) => {
    const params = tenantCampaignDebtorComplianceSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const scope = await verifyTenantCampaignScope(deps, params.data.tenantId, params.data.campaignId);
    if (scope === 'tenant_not_found') {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }
    if (scope === 'campaign_not_found') {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const debtorRecord = await deps.debtorRecord.findUnique({
      where: { id: params.data.debtorRecordId }
    }) as {
      id: string;
      tenantId: string;
      campaignId: string;
      phone: string;
      timezone: string;
      debtAmount: number | string;
      debtStatus: string;
      consentStatus: string;
    } | null;

    if (!debtorRecord || debtorRecord.tenantId !== params.data.tenantId || debtorRecord.campaignId !== params.data.campaignId) {
      return reply.code(404).send({ error: 'DEBTOR_RECORD_NOT_FOUND' });
    }

    const debtAmount = Number(debtorRecord.debtAmount);
    if (!Number.isFinite(debtAmount)) {
      return reply.code(400).send({
        error: 'INVALID_DEBT_AMOUNT'
      });
    }

    const engine = createEngine(deps);
    const result = await engine.evaluate({
      tenantId: params.data.tenantId,
      campaignId: params.data.campaignId,
      debtorRecordId: params.data.debtorRecordId,
      phone: debtorRecord.phone,
      timezone: debtorRecord.timezone,
      debtAmount,
      debtStatus: debtorRecord.debtStatus,
      consentStatus: debtorRecord.consentStatus
    });

    return reply.code(200).send({
      decision: result.decision,
      reasons: result.blockedReasons,
      rules: result.rules
    });
  });

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/compliance-decisions',
    { preValidation: roleMiddleware(complianceRouteRoles) },
    async (request, reply) => {
    const params = tenantCampaignComplianceDecisionsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const query = tenantCampaignComplianceDecisionsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: query.error.issues
      });
    }

    const scope = await verifyTenantCampaignScope(deps, params.data.tenantId, params.data.campaignId);
    if (scope === 'tenant_not_found') {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }
    if (scope === 'campaign_not_found') {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const decisions =
      ((await deps.complianceDecision?.findMany?.({
        where: {
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          ...(query.data.decision ? { decision: query.data.decision } : {})
        },
        skip: query.data.offset,
        take: query.data.limit,
        orderBy: {
          checkedAt: 'asc'
        },
        select: {
          id: true,
          tenantId: true,
          campaignId: true,
          debtorRecordId: true,
          decision: true,
          reasonCode: true,
          reasonText: true,
          ruleVersion: true,
          checkedAt: true
        }
      }) as Array<ComplianceDecisionListRaw> | undefined) ?? []);

    return reply.code(200).send(
      decisions.map((decision) => ({
        id: decision.id,
        tenantId: decision.tenantId,
        campaignId: decision.campaignId,
        debtorRecordId: decision.debtorRecordId,
        decision: decision.decision,
        reasonCode: decision.reasonCode,
        reasonText: decision.reasonText,
        ruleVersion: decision.ruleVersion,
        checkedAt: decision.checkedAt
      }))
    );
  });
};
