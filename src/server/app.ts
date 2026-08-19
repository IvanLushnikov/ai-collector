import { fastify } from 'fastify';
import { env } from '../config/env.js';
import { serializeUnknownError } from '../logging/logger.js';
import { registerCampaignRoutes } from '../routes/campaigns.js';
import { registerComplianceRoutes } from '../routes/compliance.js';
import { registerCallRoutes } from '../routes/calls.js';
import { registerQaRoutes } from '../routes/qa.js';
import { registerScriptRoutes } from '../routes/scripts.js';
import { registerReportRoutes } from '../routes/reports.js';
import { registerUsageRoutes } from '../routes/usage.js';
import { registerTelephonyRoutes } from '../routes/telephony.js';
import { registerTenantRoutes } from '../routes/tenants.js';
import { registerProviderCredentialRoutes } from '../routes/provider-credentials.js';
import { registerAuthRoutes } from '../routes/auth.js';
import { registerTenantUserRoutes } from '../routes/tenant-users.js';
import { registerSupportAccessRoutes } from '../routes/support-access.js';
import { prisma } from '../db/client.js';
import { tenantContextMiddleware } from './middleware/tenant-context.js';
import { authContextMiddleware } from './middleware/auth-context.js';
import { createRateLimitMiddleware, type RateLimitConfig } from './middleware/rate-limit.js';
import type { ComplianceEngine } from '../compliance/engine/compliance-engine.js';
import type { VoiceProviderAdapter } from '../telephony/voice-provider/adapter.js';
import { SandboxVoiceProvider } from '../telephony/sandbox-provider/index.js';
import { MangoVoiceProvider } from '../telephony/mango/index.js';
import { createVoiceProviderResolver, type VoiceProviderResolver } from '../telephony/voice-provider/resolver.js';
import { createPrismaCredentialSecretStore } from '../secrets/credential-store.js';
import {
  createInMemoryFrequencyLedgerRepository,
  createPrismaFrequencyLedgerRepository,
  type FrequencyLedgerRepository
} from '../domain/frequency-ledger/index.js';

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
  providerCredential?: {
    create?: (args: any) => Promise<unknown>;
    findMany?: (args: any) => Promise<unknown>;
    findFirst?: (args: any) => Promise<unknown>;
    findUnique?: (args: any) => Promise<unknown>;
    update?: (args: any) => Promise<unknown>;
  };
  secretStore?: import('../secrets/credential-store.js').CredentialSecretStore;
  speechProbe?: import('../speech/credentials/probe.js').SpeechCredentialProbe;
  dek?: Buffer;
  complianceDecision?: {
    count?: (args: any) => Promise<number>;
    create?: (args: any) => Promise<unknown>;
  };
  complianceEngine?: ComplianceEngine;
  voiceProvider?: VoiceProviderAdapter;
  voiceProviderResolver?: VoiceProviderResolver;
  sandboxCallsQueueEnabled?: boolean;
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
  campaignStore?: any;
  allowHeaderIdentity?: boolean;
  frequencyLedger?: FrequencyLedgerRepository;
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

export const createApp = (dependencies: AppDependencies = {}): any => {
  const app = fastify({
    logger: env.NODE_ENV === 'test'
      ? false
      : {
        serializers: {
          err: serializeUnknownError
        }
      }
  } as any);

  const campaignStore: any = dependencies.campaignStore ?? prisma;
  const allowHeaderIdentity = dependencies.allowHeaderIdentity ?? env.NODE_ENV !== 'production';
  const frequencyLedger = dependencies.frequencyLedger
    ?? (campaignStore.$transaction && campaignStore.frequencyLedger && campaignStore.frequencyLedgerAttempt
      ? createPrismaFrequencyLedgerRepository(campaignStore)
      : createInMemoryFrequencyLedgerRepository());

  app.addHook('onRequest', async (request) => {
    request.allowHeaderIdentity = allowHeaderIdentity;
  });

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

  app.addHook('preValidation', authContextMiddleware(campaignStore));
  app.addHook('preValidation', tenantContextMiddleware);

  registerAuthRoutes(app as any, campaignStore as any, env.NODE_ENV === 'production');
  registerCampaignRoutes(app as any, campaignStore as any);
  registerComplianceRoutes(app as any, { ...(campaignStore as any), frequencyLedger });
  registerCallRoutes(app as any, {
    ...(campaignStore as AppCallDependencies),
    frequencyLedger,
    voiceProviderResolver: (campaignStore as AppCallDependencies).voiceProviderResolver ?? createVoiceProviderResolver({
      sandbox: (campaignStore as AppCallDependencies).voiceProvider ?? new SandboxVoiceProvider(),
      mango: new MangoVoiceProvider()
    })
  });
  registerQaRoutes(app as any, campaignStore as any);
  registerScriptRoutes(app as any, campaignStore as any);
  registerReportRoutes(app as any, campaignStore as any);
  registerUsageRoutes(app as any, campaignStore as any);
  registerTelephonyRoutes(app as any, campaignStore as any);
  registerTenantRoutes(app as any, campaignStore as any);
  registerTenantUserRoutes(app as any, campaignStore as any);
  registerProviderCredentialRoutes(app as any, {
    ...(campaignStore as any),
    providerCredential: (campaignStore as any).providerCredential ?? (prisma as any).providerCredential,
    secretStore: (campaignStore as any).secretStore ?? createPrismaCredentialSecretStore(prisma as any),
    dek: (campaignStore as any).dek,
    speechProbe: (campaignStore as any).speechProbe,
    platformEnv: (campaignStore as any).platformEnv
  });
  registerSupportAccessRoutes(app as any, campaignStore as any);

  return app;
};
