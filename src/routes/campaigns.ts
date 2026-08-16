import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parseDebtorImportCsv } from '../import/debtor-import-parser.js';
import { validateDebtorImportRows } from '../import/debtor-import-validator.js';
import { roleMiddleware } from '../server/middleware/rbac.js';

type CampaignDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  user: {
    findFirst: (args: any) => Promise<unknown>;
  };
  campaign: {
    create: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
    findUnique?: (args: any) => Promise<unknown>;
    update?: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
  debtorRecord?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
  };
  callAttempt?: {
    count?: (args: any) => Promise<number>;
  };
  complianceDecision?: {
    count?: (args: any) => Promise<number>;
  };
};

const createCampaignSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  timezone: z.string().min(1)
});

const tenantCampaignsSchema = z.object({
  tenantId: z.string().uuid()
});

const tenantCampaignDetailSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().min(1)
});

const campaignStatusValues = [
  'draft',
  'review',
  'ready',
  'running',
  'auto_paused',
  'completed',
  'archived'
] as const;

const allowedStatusTransitions: Record<string, string[]> = {
  draft: ['review'],
  review: ['ready'],
  ready: ['running'],
  running: ['auto_paused', 'completed'],
  auto_paused: ['review'],
  completed: ['archived'],
  archived: []
};

const campaignStatusTransitionSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().min(1)
});

const campaignStatusUpdateSchema = z.object({
  status: z.enum(campaignStatusValues)
});

const campaignDebtorImportSchema = z.object({
  csvContent: z.string().min(1)
});

export const registerCampaignRoutes = (app: FastifyInstance, deps: CampaignDependencies): void => {
  app.post('/campaigns', { preValidation: roleMiddleware(['owner', 'collection_manager']) }, async (request, reply) => {
    const payload = createCampaignSchema.safeParse(request.body);
    if (!payload.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: payload.error.issues
      });
    }

    const tenantId = request.tenantContext?.tenantId ?? payload.data.tenantId;

    const tenant = await deps.tenant.findUnique({
      where: { id: tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const actor = await deps.user.findFirst({
      where: {
        tenantId,
        isActive: true,
        status: 'active'
      }
    }) as { id: string } | null;
    if (!actor) {
      return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
    }

  const campaign = await deps.campaign.create({
      data: {
        tenantId,
        name: payload.data.name,
        timezone: payload.data.timezone,
        status: 'draft',
        createdByUserId: actor.id
      }
    });

    if (deps.auditLog?.create) {
      await deps.auditLog.create({
        data: {
          tenantId,
          userId: actor.id,
          action: 'campaign.created',
          entityType: 'campaign',
          entityId: (campaign as { id: string }).id,
          metadata: {
            name: payload.data.name,
            timezone: payload.data.timezone,
            source: 'api',
            sourceRoute: '/campaigns'
          }
        }
      });
    }

    return reply.code(201).send(campaign);
  });

  app.get('/tenants/:tenantId/campaigns', async (request, reply) => {
    const params = tenantCampaignsSchema.safeParse(request.params);
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

    const campaigns = (await (deps.campaign.findMany?.({
      where: { tenantId: params.data.tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        timezone: true,
        createdAt: true
      }
    }) as unknown as Array<{
      id: string;
      name: string;
      status: string;
      timezone: string;
      createdAt: string;
    }>)) ?? [];

    return reply.code(200).send(campaigns);
  });

  app.get('/tenants/:tenantId/campaigns/:campaignId', async (request, reply) => {
    const params = tenantCampaignDetailSchema.safeParse(request.params);
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

    let campaign: {
      id: string;
      tenantId: string;
      name: string;
      status: string;
      timezone: string;
      createdAt: string;
    } | null = null;

    if (deps.campaign.findUnique) {
      campaign = await deps.campaign.findUnique({
        where: { id: params.data.campaignId }
      }) as {
        id: string;
        tenantId: string;
        name: string;
        status: string;
        timezone: string;
        createdAt: string;
      } | null;
    }

    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const [debtorRecords, callAttempts, complianceBlocks] = await Promise.all([
      (deps.debtorRecord?.count?.({ where: { campaignId: params.data.campaignId } }) ?? Promise.resolve(0)),
      (deps.callAttempt?.count?.({ where: { campaignId: params.data.campaignId } }) ?? Promise.resolve(0)),
      (deps.complianceDecision?.count?.({
        where: {
          campaignId: params.data.campaignId,
          decision: 'block'
        }
      }) ?? Promise.resolve(0))
    ]);

    return reply.code(200).send({
      id: campaign.id,
      tenantId: campaign.tenantId,
      name: campaign.name,
      status: campaign.status,
      timezone: campaign.timezone,
      createdAt: campaign.createdAt,
      debtorRecordsCount: debtorRecords,
      callAttemptsCount: callAttempts,
      complianceBlocksCount: complianceBlocks
    });
  });

  app.patch('/tenants/:tenantId/campaigns/:campaignId/status', async (request, reply) => {
    const params = campaignStatusTransitionSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const payload = campaignStatusUpdateSchema.safeParse(request.body);
    if (!payload.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: payload.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    let campaign: {
      id: string;
      tenantId: string;
      status: string;
    } | null = null;
    if (deps.campaign.findUnique) {
      campaign = await deps.campaign.findUnique({
        where: { id: params.data.campaignId }
      }) as {
        id: string;
        tenantId: string;
        status: string;
      } | null;
    }

    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const nextStatus = payload.data.status;
    if (!allowedStatusTransitions[campaign.status]?.includes(nextStatus)) {
      return reply.code(400).send({
        error: 'INVALID_STATUS_TRANSITION',
        from: campaign.status,
        to: nextStatus
      });
    }

    const updated = await (deps.campaign.update?.({
      where: { id: params.data.campaignId },
      data: { status: nextStatus },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        timezone: true,
        createdAt: true
      }
    }) ?? Promise.resolve(null)) as {
      id: string;
      tenantId: string;
      name: string;
      status: string;
      timezone: string;
      createdAt: string;
    };

    return reply.code(200).send(updated);
  });

  app.post('/tenants/:tenantId/campaigns/:campaignId/debtors/import', async (request, reply) => {
    const params = tenantCampaignDetailSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const payload = campaignDebtorImportSchema.safeParse(request.body);
    if (!payload.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: payload.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    let campaign: {
      id: string;
      tenantId: string;
    } | null = null;
    if (deps.campaign.findUnique) {
      campaign = await deps.campaign.findUnique({
        where: { id: params.data.campaignId }
      }) as {
        id: string;
        tenantId: string;
      } | null;
    }

    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    let parsedRows;
    try {
      parsedRows = parseDebtorImportCsv(payload.data.csvContent);
    } catch (error) {
      return reply.code(400).send({
        error: 'INVALID_CSV',
        message: error instanceof Error ? error.message : 'CSV parsing error'
      });
    }

    const validation = validateDebtorImportRows(parsedRows.rows);
    const errors = [...validation.errors];

    type DebtorImportRecordPayload = {
      tenantId: string;
      campaignId: string;
      externalId: string;
      phone: string;
      timezone: string;
      debtAmount: number;
      debtStatus: string;
      consentStatus: string;
    };

    const rows = parsedRows.rows;
    const validDebtorRows = validation.validRows
      .map((row) => {
        const rowNumber = rows.indexOf(row) + 2;

        const debtAmount = Number(row.debtAmount);
        if (!Number.isFinite(debtAmount)) {
          errors.push({
            row: rowNumber,
            field: 'debtAmount',
            message: 'Debt amount is invalid'
          });
          return null;
        }

        return {
          rowNumber,
          payload: {
            tenantId: params.data.tenantId,
            campaignId: params.data.campaignId,
            externalId: row.externalId,
            phone: row.phone,
            timezone: row.timezone,
            debtAmount,
            debtStatus: row.debtStatus,
            consentStatus: row.consentStatus
          } as DebtorImportRecordPayload
        };
      })
      .filter((row): row is { rowNumber: number; payload: DebtorImportRecordPayload } => row !== null);

    const acceptedDebtors = await Promise.all(
      validDebtorRows.map(async ({ payload: debtor }) => {
        if (!deps.debtorRecord?.create) {
          return null;
        }

        await deps.debtorRecord.create({
          data: debtor
        });
        return debtor;
      })
    );

    const acceptedRows = acceptedDebtors.filter(Boolean);

    return reply.code(200).send({
      acceptedCount: acceptedRows.length,
      rejectedCount: rows.length - acceptedRows.length,
      errors
    });
  });
};
