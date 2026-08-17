import { FastifyInstance } from 'fastify';
import { z } from 'zod';

type ScriptDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  user: {
    findFirst: (args: any) => Promise<unknown>;
  };
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
    update: (args: any) => Promise<unknown>;
  };
  scriptVersion: {
    findFirst: (args: any) => Promise<unknown>;
    create: (args: any) => Promise<unknown>;
    findMany: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
};

const tenantCampaignScriptsSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid()
});

const createScriptSchema = z.object({
  content: z.string().min(1)
});

export const registerScriptRoutes = (app: FastifyInstance, deps: ScriptDependencies): void => {
  app.get('/tenants/:tenantId/campaigns/:campaignId/scripts', async (request, reply) => {
    const params = tenantCampaignScriptsSchema.safeParse(request.params);
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

    const scripts = await deps.scriptVersion.findMany({
      where: {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId
      },
      orderBy: {
        version: 'asc'
      },
      select: {
        version: true,
        status: true,
        createdAt: true,
        createdByUserId: true
      }
    }) as Array<{
      version: number;
      status: string;
      createdAt: string;
      createdByUserId: string;
    }>;

    return reply.code(200).send(scripts);
  });

  app.post('/tenants/:tenantId/campaigns/:campaignId/scripts', async (request, reply) => {
    const params = tenantCampaignScriptsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const payload = createScriptSchema.safeParse(request.body);
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

    const campaign = await deps.campaign.findUnique({
      where: { id: params.data.campaignId }
    }) as { id: string; tenantId: string; status?: string } | null;
    if (!campaign || campaign.tenantId !== params.data.tenantId) {
      return reply.code(404).send({ error: 'CAMPAIGN_NOT_FOUND' });
    }

    if (campaign.status === 'running') {
      return reply.code(409).send({ error: 'SCRIPT_VERSION_LOCKED' });
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

    const previousScript = await deps.scriptVersion.findFirst({
      where: { campaignId: params.data.campaignId },
      orderBy: {
        version: 'desc'
      },
      select: { version: true }
    }) as { version: number } | null;

    const script = await deps.scriptVersion.create({
      data: {
        tenantId: params.data.tenantId,
        campaignId: params.data.campaignId,
        version: (previousScript?.version ?? 0) + 1,
        content: payload.data.content,
        createdByUserId: actor.id
      }
    }) as {
      id: string;
      tenantId: string;
      campaignId: string;
      version: number;
      status: string;
      content: string;
      createdByUserId: string;
      createdAt: string;
    };

    const updatedCampaign = await deps.campaign.update({
      where: { id: params.data.campaignId },
      data: { status: 'review' }
    }) as {
      id: string;
      status: string;
    };

    if (deps.auditLog?.create) {
      await deps.auditLog.create({
        data: {
          tenantId: params.data.tenantId,
          userId: actor.id,
          action: 'script_version.created',
          entityType: 'scriptVersion',
          entityId: script.id,
          metadata: {
            campaignId: params.data.campaignId,
            version: script.version,
            campaignStatus: updatedCampaign.status,
            sourceRoute: '/tenants/{tenantId}/campaigns/{campaignId}/scripts'
          }
        }
      });
    }

    return reply.code(201).send({
      ...script,
      campaign: {
        id: updatedCampaign.id,
        status: updatedCampaign.status
      }
    });
  });
};
