import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { isCallResultQaStatus } from '../domain/call-result/index.js';
import { roleMiddleware } from '../server/middleware/rbac.js';

type QaStatus = 'approved' | 'flagged';

type QaDependencies = {
  tenant: {
    findUnique: (args: any) => Promise<unknown>;
  };
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  callAttempt: {
    findUnique: (args: any) => Promise<unknown>;
  };
  callResult: {
    update: (args: any) => Promise<unknown>;
  };
  user: {
    findFirst: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
};

const tenantCampaignCallSchema = z.object({
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid(),
  callAttemptId: z.string().uuid()
});

const qaUpdateSchema = z.object({
  qaStatus: z.enum(['approved', 'flagged'])
});

export const registerQaRoutes = (app: FastifyInstance, deps: QaDependencies): void => {
  app.patch(
    '/tenants/:tenantId/campaigns/:campaignId/calls/:callAttemptId/qa',
    { preValidation: roleMiddleware(['owner', 'collection_manager', 'qa_analyst', 'compliance_officer']) },
    async (request, reply) => {
    const params = tenantCampaignCallSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: params.error.issues
      });
    }

    const body = qaUpdateSchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        issues: body.error.issues
      });
    }

    if (!isCallResultQaStatus(body.data.qaStatus)) {
      return reply.code(400).send({
        error: 'INVALID_QA_STATUS'
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

    const rawAttempt = await deps.callAttempt.findUnique({
      where: { id: params.data.callAttemptId },
      include: {
        callResult: {
          select: {
            id: true,
            qaStatus: true
          }
        },
        debtorRecord: {
          select: {
            tenantId: true,
            campaignId: true
          }
        }
      }
    });

    const attempt = rawAttempt as {
      id: string;
      tenantId: string;
      campaignId: string;
      callResult: {
        id: string;
        qaStatus: QaStatus | 'not_reviewed' | 'approved' | 'flagged' | string;
      } | null;
      debtorRecord: {
        tenantId: string;
        campaignId: string;
      } | null;
    } | null;

    if (
      !attempt ||
      attempt.tenantId !== params.data.tenantId ||
      attempt.campaignId !== params.data.campaignId ||
      !attempt.debtorRecord ||
      attempt.debtorRecord.tenantId !== params.data.tenantId ||
      attempt.debtorRecord.campaignId !== params.data.campaignId ||
      !attempt.callResult
    ) {
      return reply.code(404).send({ error: 'CALL_ATTEMPT_NOT_FOUND' });
    }

    const updatedResult = await deps.callResult.update({
      where: { id: attempt.callResult.id },
      data: {
        qaStatus: body.data.qaStatus
      }
    }) as {
      id: string;
      qaStatus: string;
    };

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

    await deps.auditLog?.create?.({
      data: {
        tenantId: params.data.tenantId,
        userId: actor.id,
        action: 'call.qa_updated',
        entityType: 'callResult',
        entityId: updatedResult.id,
        metadata: {
          callAttemptId: params.data.callAttemptId,
          campaignId: params.data.campaignId,
          qaStatus: body.data.qaStatus,
          previousQaStatus: attempt.callResult.qaStatus
        }
      }
    });

      return reply.code(200).send(updatedResult);
  });
};
