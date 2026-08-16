import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ComplianceEngine } from '../compliance/engine/compliance-engine.js';
import { CallWindowComplianceRule } from '../compliance/rules/call-window.js';
import { ConsentStatusRule } from '../compliance/rules/consent-status.js';
import { DebtStatusRule } from '../compliance/rules/debt-status.js';

type ComplianceDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  debtorRecord: {
    findUnique: (args: any) => Promise<unknown>;
  };
  complianceDecision?: {
    create?: (args: any) => Promise<unknown>;
  };
  complianceEngine?: ComplianceEngine;
};

const tenantCampaignDebtorComplianceSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid(),
  debtorRecordId: z.string().uuid()
});

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

export const registerComplianceRoutes = (app: FastifyInstance, deps: ComplianceDependencies): void => {
  app.post('/tenants/:tenantId/campaigns/:campaignId/debtors/:debtorRecordId/compliance/check', async (request, reply) => {
    const params = tenantCampaignDebtorComplianceSchema.safeParse(request.params);
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

    const debtorRecord = await deps.debtorRecord.findUnique({
      where: {
        id: params.data.debtorRecordId
      }
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
};
