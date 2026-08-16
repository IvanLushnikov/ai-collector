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
import { prisma } from '../db/client.js';
import { tenantContextMiddleware } from './middleware/tenant-context.js';
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

export type AppDependencies = {
  campaignStore?: CampaignDependencies;
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

export const createApp = (dependencies: AppDependencies = {}): FastifyInstance => {
  const app = fastify({
    logger: env.NODE_ENV === 'development'
  });

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

  const campaignStore = dependencies.campaignStore ?? prisma;
  registerCampaignRoutes(app, campaignStore);
  registerComplianceRoutes(app, campaignStore as CampaignStoreWithComplianceRouteDeps);
  registerCallRoutes(app, campaignStore as AppCallDependencies);
  registerQaRoutes(app, campaignStore as AppQaDependencies);
  registerScriptRoutes(app, campaignStore as AppScriptDependencies);
  registerReportRoutes(app, campaignStore as CampaignStoreWithReportRouteDeps);
  registerUsageRoutes(app, campaignStore as CampaignStoreWithUsageRouteDeps);
  registerTelephonyRoutes(app, campaignStore as TelephonyDependencies);

  return app;
};
