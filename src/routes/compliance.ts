import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ComplianceEngine } from '../compliance/engine/compliance-engine.js';
import { CallWindowComplianceRule } from '../compliance/rules/call-window.js';
import { ConsentStatusRule } from '../compliance/rules/consent-status.js';
import { DebtStatusRule } from '../compliance/rules/debt-status.js';
import { FrequencyLimitRule } from '../compliance/rules/frequency-limit.js';
import { SuppressionRule, createInMemorySuppressionLookup, type SuppressionLookup } from '../compliance/rules/suppression.js';
import {
  createInMemoryFrequencyLedgerRepository,
  type FrequencyLedgerRepository
} from '../domain/frequency-ledger/index.js';
import { authorizeZone, canAccessZone, normalizeRole } from '../server/authz/index.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const authorizeComplianceCheck = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  let actor = request.actor;
  if (!actor) {
    const roleHeader = request.headers['x-user-role'];
    const rawRole = Array.isArray(roleHeader) ? roleHeader[0] : roleHeader;
    if (request.allowHeaderIdentity && typeof rawRole === 'string' && rawRole.trim()) {
      const canonicalRole = normalizeRole(rawRole);
      if (!canonicalRole) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'User role is not allowed for this endpoint'
        });
      }
      actor = {
        canonicalRole,
        source: 'header',
        tenantId: request.tenantContext?.tenantId,
        supportGrant: null
      };
      request.actor = actor;
      request.userRole = canonicalRole;
    }
  }

  if (!actor) {
    return reply.code(401).send({
      error: 'USER_ROLE_MISSING',
      message: 'X-User-Role header is required'
    });
  }

  if (actor.canonicalRole === 'support_engineer') {
    const grant = actor.supportGrant;
    const requestTenantId = request.tenantContext?.tenantId;
    const validGrant = Boolean(
      grant
      && requestTenantId
      && grant.tenantId === requestTenantId
      && grant.revokedAt == null
      && new Date(grant.expiresAt).getTime() > Date.now()
    );
    if (!validGrant) {
      return reply.code(403).send({
        error: 'SUPPORT_ACCESS_REQUIRED',
        message: 'Support access grant is required for tenant data access'
      });
    }
  }

  const allowed = canAccessZone(actor.canonicalRole, 'compliance', 'write')
    || canAccessZone(actor.canonicalRole, 'calls', 'write');
  if (!allowed) {
    return reply.code(403).send({
      error: 'FORBIDDEN',
      message: 'User role is not allowed for this endpoint'
    });
  }
};

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
  frequencyLedger?: FrequencyLedgerRepository;
  suppressionLookup?: SuppressionLookup;
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

const createEngine = (deps: ComplianceDependencies): ComplianceEngine => {
  if (deps.complianceEngine) {
    return deps.complianceEngine;
  }

  return new ComplianceEngine(
    [
      new CallWindowComplianceRule(),
      new ConsentStatusRule(),
      new DebtStatusRule(),
      new FrequencyLimitRule(deps.frequencyLedger ?? createInMemoryFrequencyLedgerRepository()),
      new SuppressionRule(deps.suppressionLookup ?? createInMemorySuppressionLookup())
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
    { preValidation: authorizeComplianceCheck },
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
      externalId?: string;
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
      consentStatus: debtorRecord.consentStatus,
      creditorKey: params.data.tenantId,
      obligationId: debtorRecord.externalId ?? debtorRecord.id
    });

    return reply.code(200).send({
      decision: result.decision,
      reasons: result.blockedReasons,
      rules: result.rules
    });
  });

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/compliance-decisions',
    { preValidation: authorizeZone('calls', 'read') },
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
