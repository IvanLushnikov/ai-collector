import { fastify, FastifyInstance } from 'fastify';
import { env } from '../config/env.js';
import { registerCampaignRoutes } from '../routes/campaigns.js';
import { registerComplianceRoutes } from '../routes/compliance.js';
import { registerCallRoutes } from '../routes/calls.js';
import { registerQaRoutes } from '../routes/qa.js';
import { registerScriptRoutes } from '../routes/scripts.js';
import { registerReportRoutes } from '../routes/reports.js';
import { registerUsageRoutes } from '../routes/usage.js';
import { registerTelephonyRoutes } from '../routes/telephony.js';
import { registerTenantRoutes } from '../routes/tenants.js';
import { prisma } from '../db/client.js';
import { tenantContextMiddleware } from './middleware/tenant-context.js';
import { createRateLimitMiddleware, type RateLimitConfig } from './middleware/rate-limit.js';
import type { ComplianceEngine } from '../compliance/engine/compliance-engine.js';
import type { VoiceProviderAdapter } from '../telephony/voice-provider/adapter.js';

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
    findFirst?: (args: any) => Promise<unknown>;
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
  };
  debtorRecord?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
    findUnique?: (args: any) => Promise<unknown>;
  };
  callAttempt?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
  };
  callResult?: {
    create?: (args: any) => Promise<unknown>;
  };
  usageEvent?: {
    create?: (args: any) => Promise<unknown>;
  };
  telephonyConnection?: {
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
    findUnique?: (args: any) => Promise<unknown>;
  };
  auditLog?: {
    create?: (args: any) => Promise<unknown>;
  };
  complianceDecision?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
  };
  complianceEngine?: ComplianceEngine;
  voiceProvider?: VoiceProviderAdapter;
};

const createRateLimitAuditEntry = async (
  payload: {
    tenantId: string | null;
    requestPath: string;
    requestId: string;
    method: string;
    ip: string;
    limit: number;
    used: number;
    windowMs: number;
    resetAt: string;
    statusCode: number;
    errorCode: string;
  },
  campaignStore: CampaignDependencies
) => {
  if (!campaignStore?.auditLog?.create) {
    return;
  }

  if (!payload.tenantId) {
    return;
  }

  const actor = await campaignStore.user.findFirst({
    where: {
      tenantId: payload.tenantId,
      isActive: true,
      status: 'active'
    }
  }) as { id: string } | null;
  if (!actor?.id) {
    return;
  }

  await campaignStore.auditLog.create({
    data: {
      tenantId: payload.tenantId,
      userId: actor.id,
      action: 'security.rate_limit_exceeded',
      entityType: 'security',
      entityId: `${payload.requestPath}:${payload.requestId}`,
      metadata: {
        requestPath: payload.requestPath,
        requestId: payload.requestId,
        method: payload.method,
        ip: payload.ip,
        windowMs: payload.windowMs,
        limit: payload.limit,
        used: payload.used,
        resetAt: payload.resetAt,
        statusCode: payload.statusCode,
        errorCode: payload.errorCode
      }
    }
  });
};

export type AppDependencies = {
  campaignStore?: CampaignDependencies;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    onLimitExceeded?: RateLimitConfig['onLimitExceeded'];
  };
};

type CampaignStoreWithComplianceRouteDeps = CampaignDependencies & {
  debtorRecord: {
    findUnique: (args: any) => Promise<unknown>;
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
  };
};

type AppCallDependencies = CampaignDependencies & {
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  debtorRecord: {
    findUnique: (args: any) => Promise<unknown>;
  };
  callAttempt: {
    create: (args: any) => Promise<unknown>;
    findMany: (args: any) => Promise<unknown>;
    findUnique: (args: any) => Promise<unknown>;
  };
  callResult: {
    create: (args: any) => Promise<unknown>;
    update?: (args: any) => Promise<unknown>;
  };
  usageEvent?: {
    create: (args: any) => Promise<unknown>;
  };
};

type AppQaDependencies = CampaignDependencies & {
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  callAttempt: {
    findUnique: (args: any) => Promise<unknown>;
  };
  callResult: {
    update: (args: any) => Promise<unknown>;
  };
};

type CampaignStoreWithReportRouteDeps = CampaignDependencies & {
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  debtorRecord: {
    count: (args: any) => Promise<number>;
  };
  callAttempt: {
    count: (args: any) => Promise<number>;
  };
  callResult: {
    count: (args: any) => Promise<number>;
  };
  complianceDecision: {
    count: (args: any) => Promise<number>;
  };
  usageEvent?: {
    count?: (args: any) => Promise<number>;
    findMany?: (
      args: {
        where: { tenantId: string; campaignId: string };
        select: { sourceId: true; eventType: true; quantity: true; unit: true };
      }
    ) => Promise<Array<{
      tenantId: string;
      campaignId: string;
      eventType: string;
      quantity: number;
      unit: string;
      sourceId: string;
    }>>;
  };
};

type CampaignStoreWithUsageRouteDeps = CampaignDependencies & {
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
  };
  usageEvent?: {
    findMany?: (args: any) => Promise<unknown>;
  };
};

type TelephonyDependencies = CampaignDependencies & {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  telephonyConnection: {
    create: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
  };
};

type AppScriptDependencies = CampaignDependencies & {
  campaign: {
    findUnique: (args: any) => Promise<unknown>;
    update: (args: any) => Promise<unknown>;
  };
  scriptVersion: {
    findFirst: (args: any) => Promise<unknown>;
    create: (args: any) => Promise<unknown>;
    findMany: (args: any) => Promise<unknown>;
  };
};

type TenantDependencies = CampaignDependencies & {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string; connectedMinuteRateRub: number | null } | null>;
    update: (args: { where: { id: string }; data: { connectedMinuteRateRub: number | null } }) => Promise<{ id: string; connectedMinuteRateRub: number | null }>;
  };
};

export const createApp = (dependencies: AppDependencies = {}): FastifyInstance => {
  const app = fastify({
    logger: env.NODE_ENV === 'development'
  });

  const campaignStore = dependencies.campaignStore ?? prisma;

  const rateLimitConfig = dependencies.rateLimit ?? {
    maxRequests: env.API_RATE_LIMIT_MAX_REQUESTS,
    windowMs: env.API_RATE_LIMIT_WINDOW_MS
  };
  app.addHook(
    'preHandler',
    createRateLimitMiddleware({
      maxRequests: rateLimitConfig.maxRequests,
      windowMs: rateLimitConfig.windowMs,
      onLimitExceeded: async (payload) => {
        if (rateLimitConfig.onLimitExceeded) {
          await rateLimitConfig.onLimitExceeded(payload);
        }

        try {
          await createRateLimitAuditEntry(payload, campaignStore as CampaignDependencies);
        } catch {
          // rate-limit logging should never block the request path.
        }
      }
    })
  );

  app.get('/healthz', async () => ({
    status: 'ok',
    service: 'ai-collector-backend',
    env: env.NODE_ENV
  }));

  app.get('/', async () => ({
    status: 'ok',
    message: 'AI Collector API is running'
  }));

  app.addHook('preValidation', tenantContextMiddleware);

  registerCampaignRoutes(app, campaignStore);
  registerComplianceRoutes(app, campaignStore as CampaignStoreWithComplianceRouteDeps);
  registerCallRoutes(app, campaignStore as AppCallDependencies);
  registerQaRoutes(app, campaignStore as AppQaDependencies);
  registerScriptRoutes(app, campaignStore as AppScriptDependencies);
  registerReportRoutes(app, campaignStore as CampaignStoreWithReportRouteDeps);
  registerUsageRoutes(app, campaignStore as CampaignStoreWithUsageRouteDeps);
  registerTelephonyRoutes(app, campaignStore as TelephonyDependencies);
  registerTenantRoutes(app, campaignStore as TenantDependencies);

  return app;
};
