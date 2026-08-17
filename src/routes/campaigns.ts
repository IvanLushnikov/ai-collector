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
  scriptVersion?: {
    findMany?: (args: any) => Promise<unknown>;
  };
  telephonyConnection?: {
    findMany?: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
  };
  debtorRecord?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
  };
  callAttempt?: {
    count?: (args: any) => Promise<number>;
    findMany?: (args: any) => Promise<unknown>;
  };
  callResult?: {
    findUnique?: (args: any) => Promise<unknown>;
    update?: (args: any) => Promise<unknown>;
  };
  complianceDecision?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
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

const tenantCampaignsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0)
});

const tenantCampaignDetailSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().min(1)
});

const tenantCampaignReadinessSchema = z.object({
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

const tenantCampaignAuditLogSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().min(1)
});

const tenantAuditLogSchema = z.object({
  tenantId: z.string().uuid()
});

const tenantAuditLogQuerySchema = z.object({
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  campaignId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0)
});

const tenantCampaignReviewItemsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).max(1000).default(0)
});
const tenantCampaignReviewItemSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().min(1),
  itemId: z.string().min(1)
});

const tenantCampaignReviewItemResolveSchema = z.object({
  action: z.enum(['approve', 'reject', 'escalate', 'requeue']),
  notes: z.string().max(4000).optional()
});

const toIsoString = (value: string | Date | null): string => new Date(value).toISOString();

type ReviewItemType = 'qa' | 'compliance';

type ParsedReviewItem = {
  itemType: ReviewItemType;
  itemEntityId: string;
};

const parseReviewItemId = (itemId: string): ParsedReviewItem | null => {
  if (itemId.startsWith('qa-')) {
    return {
      itemType: 'qa',
      itemEntityId: itemId.slice(3)
    };
  }

  if (itemId.startsWith('compliance-')) {
    return {
      itemType: 'compliance',
      itemEntityId: itemId.slice(11)
    };
  }

  return null;
};

const resolveQaActionToQaStatus = (
  action: z.infer<typeof tenantCampaignReviewItemResolveSchema>['action']
): 'approved' | 'flagged' => (action === 'approve' ? 'approved' : 'flagged');

const getReviewUrgency = (itemType: 'qa' | 'compliance', outcome: string | null | undefined = null): 'high' | 'medium' => {
  if (itemType === 'compliance') {
    return 'high';
  }

  return outcome === 'error' || outcome === 'blocked' || outcome === 'dispute' ? 'high' : 'medium';
};

const campaignAuditLogQuerySchema = z.object({
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0)
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

  app.get(
    '/tenants/:tenantId/campaigns',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'operator', 'qa_analyst', 'compliance_officer', 'integration_admin']) },
    async (request, reply) => {
    const params = tenantCampaignsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const query = tenantCampaignsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: query.error.issues
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
      skip: query.data.offset,
      take: query.data.limit,
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

  app.get(
    '/tenants/:tenantId/audit-logs',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'qa_analyst', 'compliance_officer', 'integration_admin']) },
    async (request, reply) => {
    const params = tenantAuditLogSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const query = tenantAuditLogQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: query.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const rows = (await (deps.auditLog?.findMany?.({
      where: { tenantId: params.data.tenantId },
      orderBy: { createdAt: 'desc' }
    }) ?? Promise.resolve([]))) as Array<{
      id: string;
      tenantId: string;
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      metadata: Record<string, unknown>;
      createdAt: string;
    }>;

    const filteredRows = rows
      .filter((item) => {
        if (query.data.action && item.action !== query.data.action) {
          return false;
        }

        if (query.data.entityType && item.entityType !== query.data.entityType) {
          return false;
        }

        if (!query.data.campaignId) {
          return true;
        }

        const metadataCampaignId =
          typeof item.metadata === 'object' &&
          item.metadata !== null &&
          'campaignId' in item.metadata &&
          typeof item.metadata.campaignId === 'string'
            ? item.metadata.campaignId
            : '';

        return metadataCampaignId === query.data.campaignId;
      })
      .map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        metadata: item.metadata,
        createdAt: new Date(item.createdAt).toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const from = query.data.offset;
    const to = query.data.offset + query.data.limit;
    const response = filteredRows.slice(from, to);

    return reply.code(200).send(response);
  });

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'operator', 'qa_analyst', 'compliance_officer', 'integration_admin']) },
    async (request, reply) => {
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

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/readiness-summary',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'operator', 'qa_analyst', 'compliance_officer', 'integration_admin']) },
    async (request, reply) => {
    const params = tenantCampaignReadinessSchema.safeParse(request.params);
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

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as {
      id: string;
      tenantId: string;
      status: string;
      updatedAt: string;
    } | null;

    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const [rawDebtorCount, rawScriptVersions, rawTelephonyConnections, complianceBlocks, rawComplianceReasons] = await Promise.all([
      (deps.debtorRecord?.count?.({ where: { campaignId: params.data.campaignId } }) ?? Promise.resolve(0)),
      (deps.scriptVersion?.findMany?.({
        where: { campaignId: params.data.campaignId },
        select: {
          status: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      }) ?? Promise.resolve([])),
      (deps.telephonyConnection?.findMany?.({
        where: { tenantId: params.data.tenantId },
        select: {
          mode: true,
          status: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      }) ?? Promise.resolve([])),
      (deps.complianceDecision?.count?.({
        where: {
          campaignId: params.data.campaignId,
          decision: 'block'
        }
      }) ?? Promise.resolve(0)),
      (deps.complianceDecision?.findMany?.({
        where: {
          campaignId: params.data.campaignId,
          decision: 'block'
        },
        orderBy: {
          checkedAt: 'desc'
        },
        take: 3,
        select: {
          id: true,
          reasonCode: true,
          reasonText: true,
          checkedAt: true
        }
      }) ?? Promise.resolve([]))
    ]);

    const debtorRecordsCount = rawDebtorCount as number;
    const scriptVersions = rawScriptVersions as Array<{ status: string; updatedAt: string }>;
    const telephonyConnections = rawTelephonyConnections as Array<{ mode: string; status: string; updatedAt: string }>;
    const complianceBlockReasons = rawComplianceReasons as Array<{
      id: string;
      reasonCode: string;
      reasonText: string;
      checkedAt: string;
    }>;

    const activeScriptVersions = scriptVersions.filter((scriptVersion) => scriptVersion.status === 'active');
    const activeProductionTelephonyConnections = telephonyConnections.filter(
      (connection) => connection.mode === 'production' && connection.status === 'active'
    );
    const campaignUpdatedAt = Date.parse(campaign.updatedAt);
    const readinessLastUpdatedAt = Math.max(
      campaignUpdatedAt,
      ...scriptVersions.map((scriptVersion) => Date.parse(scriptVersion.updatedAt)),
      ...telephonyConnections.map((connection) => Date.parse(connection.updatedAt))
    );

    const reasons: Array<{ source: string; reasonCode: string; reasonText: string; nextAction: string }> = [];
    if (debtorRecordsCount === 0) {
      reasons.push({
        source: 'debtors',
        reasonCode: 'DEBTORS_MISSING',
        reasonText: 'No debtor records are imported for this campaign',
        nextAction: 'Upload debtor records via CSV import'
      });
    }

    if (activeScriptVersions.length === 0) {
      reasons.push({
        source: 'script',
        reasonCode: 'SCRIPT_NOT_READY',
        reasonText: 'No active script version is available for this campaign',
        nextAction: 'Create and activate a script version'
      });
    }

    if (activeProductionTelephonyConnections.length === 0) {
      reasons.push({
        source: 'telephony',
        reasonCode: 'PRODUCTION_TELEPHONY_MISSING',
        reasonText: 'No active production telephony connection is configured',
        nextAction: 'Add or activate a production telephony connection'
      });
    }

    if (complianceBlocks > 0) {
      reasons.push({
        source: 'compliance',
        reasonCode: 'COMPLIANCE_BLOCKS_DETECTED',
        reasonText: 'Campaign has blocking compliance decisions',
        nextAction: 'Resolve blocking compliance reasons and re-check readiness'
      });
    }

    if (!['review', 'ready', 'running', 'auto_paused'].includes(campaign.status)) {
      reasons.push({
        source: 'campaign',
        reasonCode: 'CAMPAIGN_STATUS_INVALID',
        reasonText: `Campaign status ${campaign.status} is not eligible for launch`,
        nextAction: campaign.status === 'archived' || campaign.status === 'completed'
          ? 'Restore campaign status before launch'
          : 'Run campaign through draft → review → ready before launch'
      });
    }

    const blocked = reasons.length > 0;
    const stale = readinessLastUpdatedAt > campaignUpdatedAt;
    const readinessState = blocked ? 'blocked' : stale ? 'stale' : 'ready';
    const readinessHash = [
      campaign.id,
      debtorRecordsCount,
      activeScriptVersions.length,
      activeProductionTelephonyConnections.length,
      complianceBlocks,
      campaignUpdatedAt,
      readinessLastUpdatedAt
    ].join('|');

    return reply.code(200).send({
      campaignId: campaign.id,
      campaignStatus: campaign.status,
      source: 'campaign-readiness-v1',
      timestamp: new Date().toISOString(),
      readinessHash,
      readinessState,
      blocked,
      stale,
      reasons,
      complianceReasons: complianceBlockReasons
    });
  });

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/audit-logs',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'qa_analyst', 'compliance_officer', 'integration_admin']) },
    async (request, reply) => {
    const params = tenantCampaignAuditLogSchema.safeParse(request.params);
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

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as { id: string; tenantId: string } | null;

    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
      }

    const query = campaignAuditLogQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: query.error.issues
      });
    }

    const rows = (await (deps.auditLog?.findMany?.({
      where: { tenantId: params.data.tenantId },
      orderBy: { createdAt: 'desc' }
    }) ?? Promise.resolve([]))) as Array<{
      id: string;
      tenantId: string;
      userId: string;
      action: string;
      entityType: string;
      entityId: string;
      metadata: Record<string, unknown>;
      createdAt: string;
    }>;

    const campaignId = params.data.campaignId;
    const campaignAudits = rows.filter((row) => {
      if (row.entityType === 'campaign' && row.entityId === campaignId) {
        return true;
      }

      const rawMetadataCampaignId = (row.metadata as Record<string, unknown>)?.campaignId;
      return String(rawMetadataCampaignId || '') === campaignId;
    });

    const filteredCampaignAudits = campaignAudits
      .filter((row) => {
        if (query.data.action && row.action !== query.data.action) {
          return false;
        }

        if (query.data.entityType && row.entityType !== query.data.entityType) {
          return false;
        }

        return true;
      })
      .map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        metadata: item.metadata,
        createdAt: new Date(item.createdAt).toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const from = query.data.offset;
    const to = query.data.offset + query.data.limit;
    const response = filteredCampaignAudits.slice(from, to);

    return reply.code(200).send(response);
  });

  app.get(
    '/tenants/:tenantId/campaigns/:campaignId/review-items',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'qa_analyst', 'compliance_officer']) },
    async (request, reply) => {
    const params = tenantCampaignReadinessSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const query = tenantCampaignReviewItemsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: query.error.issues
      });
    }

    const tenant = await deps.tenant.findUnique({
      where: { id: params.data.tenantId }
    }) as { id: string } | null;
    if (!tenant) {
      return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
    }

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as { id: string; tenantId: string } | null;
    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    const [qaItemsRaw, complianceDecisionRaw] = await Promise.all([
      (deps.callAttempt?.findMany?.({
        where: {
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          callResult: {
            qaStatus: 'flagged'
          }
        },
        include: {
          debtorRecord: {
            select: {
              id: true
            }
          },
          callResult: {
            select: {
              id: true,
              outcome: true,
              qaStatus: true,
              createdAt: true,
              reason: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }) ?? Promise.resolve([])) as Promise<
        Array<{
          id: string;
          tenantId: string;
          campaignId: string;
          debtorRecordId: string;
          createdAt: string;
          callResult: {
            id: string;
            outcome: string | null;
            qaStatus: 'flagged' | null;
            createdAt: string;
            reason: string | null;
          } | null;
          debtorRecord: {
            id: string;
          } | null;
        }>
      >,
      (deps.complianceDecision?.findMany?.({
        where: {
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          decision: 'block'
        },
        orderBy: {
          checkedAt: 'desc'
        },
        select: {
          id: true,
          tenantId: true,
          campaignId: true,
          debtorRecordId: true,
          decision: true,
          reasonCode: true,
          reasonText: true,
          checkedAt: true
        }
      }) as Promise<
        Array<{
          id: string;
          tenantId: string;
          campaignId: string;
          debtorRecordId: string;
          decision: string;
          reasonCode: string;
          reasonText: string;
          checkedAt: string;
        }>
      >) ?? Promise.resolve([])
    ]);

    const debtorRecordIds = new Set<string>([
      ...qaItemsRaw.map((item) => item.debtorRecordId),
      ...complianceDecisionRaw.map((item) => item.debtorRecordId)
    ]);

    const rawRetryCounts = await Promise.all(
      [...debtorRecordIds].map(async (debtorRecordId) => [
        debtorRecordId,
        await (deps.callAttempt?.count?.({
          where: {
            tenantId: params.data.tenantId,
            campaignId: params.data.campaignId,
            debtorRecordId
          }
        }) ?? Promise.resolve(0))
      ])
    );

    const retryCountByDebtor = new Map<string, number>(rawRetryCounts);

    const qaItems = qaItemsRaw
      .filter((item) => item.callResult && item.callResult.qaStatus === 'flagged')
      .map((item) => ({
        itemType: 'qa' as const,
        itemId: `qa-${item.callResult!.id}`,
        tenantId: item.tenantId,
        campaignId: item.campaignId,
        debtorRecordId: item.debtorRecordId,
        callAttemptId: item.id,
        callResultId: item.callResult!.id,
        createdAt: toIsoString(item.callResult!.createdAt),
        retryCount: retryCountByDebtor.get(item.debtorRecordId) ?? 0,
        urgency: getReviewUrgency('qa', item.callResult!.outcome),
        reasonCode: item.callResult!.outcome ? `QA_${item.callResult!.outcome.toUpperCase()}` : 'QA_FLAGGED',
        reasonText: item.callResult!.reason ?? 'Call requires manual QA review',
        outcome: item.callResult!.outcome
      }));

    const complianceItems = complianceDecisionRaw.map((item) => ({
      itemType: 'compliance' as const,
      itemId: `compliance-${item.id}`,
      tenantId: item.tenantId,
      campaignId: item.campaignId,
      debtorRecordId: item.debtorRecordId,
      decision: item.decision,
      reasonCode: item.reasonCode,
      reasonText: item.reasonText,
      createdAt: toIsoString(item.checkedAt),
      retryCount: retryCountByDebtor.get(item.debtorRecordId) ?? 0,
      urgency: getReviewUrgency('compliance')
    }));

    const reviewItems = [...qaItems, ...complianceItems]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    const from = query.data.offset;
    const to = query.data.offset + query.data.limit;

    return reply.code(200).send(reviewItems.slice(from, to));
  });

  app.patch(
    '/tenants/:tenantId/campaigns/:campaignId/review-items/:itemId/resolve',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'qa_analyst', 'compliance_officer']) },
    async (request, reply) => {
      const params = tenantCampaignReviewItemSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: params.error.issues
        });
      }

      const payload = tenantCampaignReviewItemResolveSchema.safeParse(request.body ?? {});
      if (!payload.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          issues: payload.error.issues
        });
      }

      const parsedItemId = parseReviewItemId(params.data.itemId);
      if (!parsedItemId) {
        return reply.code(400).send({
          error: 'INVALID_REVIEW_ITEM_ID'
        });
      }

      const tenant = await deps.tenant.findUnique({
        where: { id: params.data.tenantId }
      }) as { id: string } | null;
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const campaign = await deps.campaign.findUnique({
        where: { id: params.data.campaignId }
      }) as { id: string; tenantId: string } | null;
      if (!campaign || campaign.tenantId !== params.data.tenantId) {
        return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
      }

      const actor = await deps.user.findFirst({
        where: {
          tenantId: params.data.tenantId,
          isActive: true,
          status: 'active'
        }
      }) as { id: string } | null;
      if (!actor) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      if (parsedItemId.itemType === 'qa') {
        if (!deps.callResult?.findUnique || !deps.callResult?.update) {
          return reply.code(500).send({
            error: 'REVIEW_RESOLUTION_NOT_SUPPORTED'
          });
        }

        const rawCallResult = (await deps.callResult.findUnique({
          where: { id: parsedItemId.itemEntityId },
          include: {
            callAttempt: {
              select: {
                tenantId: true,
                campaignId: true,
                debtorRecordId: true,
                id: true
              }
            }
          }
        })) as { id: string; qaStatus: string; callAttempt: { tenantId: string; campaignId: string; debtorRecordId: string } | null } | null;

        if (
          !rawCallResult ||
          !rawCallResult.callAttempt ||
          rawCallResult.callAttempt.tenantId !== params.data.tenantId ||
          rawCallResult.callAttempt.campaignId !== params.data.campaignId
        ) {
          return reply.code(404).send({
            error: 'REVIEW_ITEM_NOT_FOUND'
          });
        }

        const updatedCallResult = (await deps.callResult.update({
          where: { id: rawCallResult.id },
          data: {
            qaStatus: resolveQaActionToQaStatus(payload.data.action)
          }
        })) as { id: string; qaStatus: string };

        await deps.auditLog?.create?.({
          data: {
            tenantId: params.data.tenantId,
            userId: actor.id,
            action: 'review_item.resolved',
            entityType: 'callResult',
            entityId: updatedCallResult.id,
            metadata: {
              itemType: 'qa',
              itemId: params.data.itemId,
              tenantId: params.data.tenantId,
              campaignId: params.data.campaignId,
              debtorRecordId: rawCallResult.callAttempt.debtorRecordId,
              action: payload.data.action,
              previousQaStatus: rawCallResult.qaStatus,
              qaStatus: updatedCallResult.qaStatus,
              notes: payload.data.notes
            }
          }
        });

        return reply.code(200).send({
          itemType: 'qa',
          itemId: params.data.itemId,
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          debtorRecordId: rawCallResult.callAttempt.debtorRecordId,
          qaStatus: updatedCallResult.qaStatus,
          action: payload.data.action
        });
      }

      if (!deps.complianceDecision?.findMany) {
        return reply.code(500).send({
          error: 'REVIEW_RESOLUTION_NOT_SUPPORTED'
        });
      }

      const rawComplianceDecision = await deps.complianceDecision.findMany({
        where: {
          id: parsedItemId.itemEntityId,
          tenantId: params.data.tenantId,
          campaignId: params.data.campaignId,
          decision: 'block'
        },
        take: 1,
        select: {
          id: true,
          tenantId: true,
          campaignId: true,
          debtorRecordId: true,
          decision: true,
          reasonCode: true,
          reasonText: true
        }
      }) as Array<{
        id: string;
        tenantId: string;
        campaignId: string;
        debtorRecordId: string;
        decision: string;
        reasonCode: string;
        reasonText: string;
      }>;

      if (rawComplianceDecision.length === 0) {
        return reply.code(404).send({
          error: 'REVIEW_ITEM_NOT_FOUND'
        });
      }

      await deps.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actor.id,
          action: 'review_item.resolved',
          entityType: 'complianceDecision',
          entityId: rawComplianceDecision[0].id,
          metadata: {
            itemType: 'compliance',
            itemId: params.data.itemId,
            tenantId: params.data.tenantId,
            campaignId: params.data.campaignId,
            debtorRecordId: rawComplianceDecision[0].debtorRecordId,
            action: payload.data.action,
            decision: rawComplianceDecision[0].decision,
            reasonCode: rawComplianceDecision[0].reasonCode,
            reasonText: rawComplianceDecision[0].reasonText,
            notes: payload.data.notes
          }
        }
      });

      return reply.code(200).send({
        itemType: 'compliance',
        itemId: params.data.itemId,
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId,
        debtorRecordId: rawComplianceDecision[0].debtorRecordId,
        action: payload.data.action,
        status: 'acknowledged'
      });
    }
  );

  app.patch(
    '/tenants/:tenantId/campaigns/:campaignId/status',
    { preValidation: roleMiddleware(['owner', 'collection_manager']) },
    async (request, reply) => {
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

    const actor = await deps.user.findFirst({
      where: {
        tenantId: params.data.tenantId,
        isActive: true,
        status: 'active'
      }
    }) as { id: string } | null;

    if (!actor) {
      return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
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

    const previousStatus = campaign.status;

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

    await deps.auditLog?.create?.({
      data: {
        tenantId: params.data.tenantId,
        userId: actor.id,
        action: 'campaign.status_updated',
        entityType: 'campaign',
        entityId: params.data.campaignId,
        metadata: {
          campaignId: params.data.campaignId,
          fromStatus: previousStatus,
          toStatus: nextStatus
        }
      }
    });

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
