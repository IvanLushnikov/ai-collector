import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../config/env.js';
import type { ProviderCredential } from '../domain/provider-credential/index.js';
import { resolveActorId } from '../server/authz/actor.js';
import { authorizeZone } from '../server/authz/index.js';
import type { CredentialSecretStore } from '../secrets/credential-store.js';
import { encryptSecret, parseDekHex, secretHintFromKey } from '../secrets/envelope.js';
import { isSpeechProviderAllowed } from '../speech/credentials/allowlist.js';
import { fakeSpeechCredentialProbe } from '../speech/credentials/fake-probe.js';
import type { SpeechCredentialProbe } from '../speech/credentials/probe.js';
import { resolveSpeechCredential, type PlatformSpeechEnv } from '../speech/credentials/resolve.js';

type ProviderCredentialDependencies = {
  tenant: {
    findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
  };
  user: {
    findFirst: (args: { where: { tenantId: string; isActive: boolean; status: string } }) => Promise<unknown>;
  };
  providerCredential: {
    create: (args: { data: Record<string, unknown> }) => Promise<ProviderCredential>;
    findMany: (args: { where: { tenantId: string }; orderBy?: { createdAt: 'asc' | 'desc' } }) => Promise<ProviderCredential[]>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<ProviderCredential | null>;
    findUnique: (args: { where: { id: string } }) => Promise<ProviderCredential | null>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<ProviderCredential>;
  };
  secretStore: CredentialSecretStore;
  auditLog?: {
    create?: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  speechProbe?: SpeechCredentialProbe;
  dek?: Buffer;
  platformEnv?: PlatformSpeechEnv;
};

const tenantSchema = z.object({
  tenantId: z.string().uuid()
});

const credentialParamsSchema = z.object({
  tenantId: z.string().uuid(),
  credentialId: z.string().min(1)
});

const metadataSchema = z.object({
  folderId: z.string().min(1).optional(),
  modelId: z.string().min(1).optional()
}).strict().optional();

const createSchema = z.object({
  capability: z.enum(['asr', 'tts', 'llm']),
  provider: z.string().min(1),
  mode: z.enum(['platform', 'byok']),
  displayName: z.string().min(1),
  apiKey: z.string().min(1).optional(),
  metadata: metadataSchema
}).superRefine((value, ctx) => {
  if (value.mode === 'platform' && value.apiKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['apiKey'],
      message: 'apiKey is not allowed for platform mode'
    });
  }
  if (value.mode === 'byok' && !value.apiKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['apiKey'],
      message: 'apiKey is required for byok mode'
    });
  }
});

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
  metadata: metadataSchema
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: 'At least one field is required'
});

const toPublicCredential = (row: ProviderCredential) => ({
  id: row.id,
  tenantId: row.tenantId,
  capability: row.capability,
  provider: row.provider,
  mode: row.mode,
  status: row.status,
  displayName: row.displayName,
  secretHint: row.secretHint,
  metadata: row.metadata,
  lastProbedAt: row.lastProbedAt,
  lastProbeResult: row.lastProbeResult,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const assertNoSecretLeak = (payload: unknown): void => {
  const serialized = JSON.stringify(payload);
  if (
    serialized.includes('"apiKey"')
    || serialized.includes('"ciphertext"')
    || serialized.includes('"nonce"')
    || serialized.includes('"authTag"')
  ) {
    throw new Error('credential response must not include secrets');
  }
};

const resolveDek = (deps: ProviderCredentialDependencies): Buffer =>
  deps.dek ?? parseDekHex(env.CREDENTIALS_ENCRYPTION_KEY);

const platformEnvOf = (deps: ProviderCredentialDependencies): PlatformSpeechEnv =>
  deps.platformEnv ?? {
    YANDEX_SPEECHKIT_API_KEY: env.YANDEX_SPEECHKIT_API_KEY,
    YANDEXGPT_API_KEY: env.YANDEXGPT_API_KEY,
    GIGACHAT_API_KEY: env.GIGACHAT_API_KEY,
    YANDEX_FOLDER_ID: env.YANDEX_FOLDER_ID
  };

export const registerProviderCredentialRoutes = (
  app: FastifyInstance,
  deps: ProviderCredentialDependencies
): void => {
  const probe = deps.speechProbe ?? fakeSpeechCredentialProbe;

  app.get(
    '/tenants/:tenantId/provider-credentials',
    { preValidation: authorizeZone('integrations', 'read') },
    async (request, reply) => {
      const params = tenantSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const rows = await deps.providerCredential.findMany({
        where: { tenantId: params.data.tenantId },
        orderBy: { createdAt: 'asc' }
      });
      const body = rows.map(toPublicCredential);
      assertNoSecretLeak(body);
      return reply.code(200).send(body);
    }
  );

  app.post(
    '/tenants/:tenantId/provider-credentials',
    { preValidation: authorizeZone('integrations', 'write') },
    async (request, reply) => {
      const params = tenantSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const payload = createSchema.safeParse(request.body ?? {});
      if (!payload.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: payload.error.issues });
      }

      if (!isSpeechProviderAllowed(payload.data.capability, payload.data.provider)) {
        return reply.code(422).send({ error: 'PROVIDER_NOT_ALLOWED' });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const existing = await deps.providerCredential.findFirst({
        where: {
          tenantId: params.data.tenantId,
          capability: payload.data.capability
        }
      });
      if (existing) {
        return reply.code(409).send({ error: 'CREDENTIAL_ALREADY_EXISTS' });
      }

      const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      const status = payload.data.mode === 'byok' ? 'pending_probe' : 'inactive';
      const secretHint = payload.data.mode === 'byok' && payload.data.apiKey
        ? secretHintFromKey(payload.data.apiKey)
        : null;

      const created = await deps.providerCredential.create({
        data: {
          tenantId: params.data.tenantId,
          capability: payload.data.capability,
          provider: payload.data.provider,
          mode: payload.data.mode,
          status,
          displayName: payload.data.displayName,
          secretHint,
          metadata: payload.data.metadata ?? {},
          lastProbedAt: null,
          lastProbeResult: null
        }
      });

      if (payload.data.mode === 'byok' && payload.data.apiKey) {
        const encrypted = encryptSecret(payload.data.apiKey, resolveDek(deps));
        await deps.secretStore.put({
          tenantId: params.data.tenantId,
          providerCredentialId: created.id,
          ...encrypted
        });
      }

      await deps.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
          action: 'provider_credential.created',
          entityType: 'providerCredential',
          entityId: created.id,
          metadata: {
            capability: created.capability,
            provider: created.provider,
            mode: created.mode,
            secretHint: created.secretHint,
            status: created.status,
            sourceRoute: '/tenants/:tenantId/provider-credentials'
          }
        }
      });

      const body = toPublicCredential(created);
      assertNoSecretLeak(body);
      return reply.code(201).send(body);
    }
  );

  app.patch(
    '/tenants/:tenantId/provider-credentials/:credentialId',
    { preValidation: authorizeZone('integrations', 'write') },
    async (request, reply) => {
      const params = credentialParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const payload = patchSchema.safeParse(request.body ?? {});
      if (!payload.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: payload.error.issues });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const existing = await deps.providerCredential.findUnique({
        where: { id: params.data.credentialId }
      });
      if (!existing || existing.tenantId !== params.data.tenantId) {
        return reply.code(404).send({ error: 'PROVIDER_CREDENTIAL_NOT_FOUND' });
      }

      const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      const rotated = Boolean(payload.data.apiKey);
      if (rotated && existing.mode === 'platform') {
        return reply.code(400).send({ error: 'VALIDATION_ERROR' });
      }

      if (rotated && payload.data.apiKey) {
        const encrypted = encryptSecret(payload.data.apiKey, resolveDek(deps));
        await deps.secretStore.put({
          tenantId: params.data.tenantId,
          providerCredentialId: existing.id,
          ...encrypted
        });
      }

      const updated = await deps.providerCredential.update({
        where: { id: existing.id },
        data: {
          ...(payload.data.displayName ? { displayName: payload.data.displayName } : {}),
          ...(payload.data.metadata ? { metadata: payload.data.metadata } : {}),
          ...(rotated && payload.data.apiKey
            ? {
              secretHint: secretHintFromKey(payload.data.apiKey),
              status: 'pending_probe',
              lastProbeResult: null
            }
            : {})
        }
      });

      await deps.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
          action: rotated ? 'provider_credential.rotated' : 'provider_credential.updated',
          entityType: 'providerCredential',
          entityId: updated.id,
          metadata: {
            capability: updated.capability,
            provider: updated.provider,
            mode: updated.mode,
            secretHint: updated.secretHint,
            status: updated.status,
            sourceRoute: '/tenants/:tenantId/provider-credentials/:credentialId'
          }
        }
      });

      const body = toPublicCredential(updated);
      assertNoSecretLeak(body);
      return reply.code(200).send(body);
    }
  );

  app.post(
    '/tenants/:tenantId/provider-credentials/:credentialId/disable',
    { preValidation: authorizeZone('integrations', 'write') },
    async (request, reply) => {
      const params = credentialParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const existing = await deps.providerCredential.findUnique({
        where: { id: params.data.credentialId }
      });
      if (!existing || existing.tenantId !== params.data.tenantId) {
        return reply.code(404).send({ error: 'PROVIDER_CREDENTIAL_NOT_FOUND' });
      }

      const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      const updated = await deps.providerCredential.update({
        where: { id: existing.id },
        data: { status: 'disabled' }
      });

      await deps.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
          action: 'provider_credential.disabled',
          entityType: 'providerCredential',
          entityId: updated.id,
          metadata: {
            capability: updated.capability,
            provider: updated.provider,
            mode: updated.mode,
            secretHint: updated.secretHint,
            status: updated.status,
            sourceRoute: '/tenants/:tenantId/provider-credentials/:credentialId/disable'
          }
        }
      });

      const body = toPublicCredential(updated);
      assertNoSecretLeak(body);
      return reply.code(200).send(body);
    }
  );

  app.post(
    '/tenants/:tenantId/provider-credentials/:credentialId/probe',
    { preValidation: authorizeZone('integrations', 'write') },
    async (request, reply) => {
      const params = credentialParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: params.error.issues });
      }

      const tenant = await deps.tenant.findUnique({ where: { id: params.data.tenantId } });
      if (!tenant) {
        return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
      }

      const existing = await deps.providerCredential.findUnique({
        where: { id: params.data.credentialId }
      });
      if (!existing || existing.tenantId !== params.data.tenantId) {
        return reply.code(404).send({ error: 'PROVIDER_CREDENTIAL_NOT_FOUND' });
      }

      const actorId = await resolveActorId(request, deps.user, params.data.tenantId);
      if (!actorId) {
        return reply.code(422).send({ error: 'NO_ACTIVE_USER_FOR_TENANT' });
      }

      let apiKey: string;
      try {
        const resolved = await resolveSpeechCredential({
          tenantId: params.data.tenantId,
          capability: existing.capability,
          requireActive: false,
          credentials: [existing],
          secretStore: deps.secretStore,
          dek: resolveDek(deps),
          env: platformEnvOf(deps)
        });
        apiKey = resolved.apiKey;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === 'SPEECH_CREDENTIAL_MISSING') {
          return reply.code(409).send({ error: 'SPEECH_CREDENTIAL_MISSING' });
        }
        if (code === 'SPEECH_CREDENTIAL_DISABLED') {
          return reply.code(409).send({ error: 'SPEECH_CREDENTIAL_DISABLED' });
        }
        return reply.code(409).send({ error: 'SPEECH_CREDENTIAL_DECRYPT_FAILED' });
      }

      const result = await probe.probe({
        apiKey,
        provider: existing.provider,
        capability: existing.capability
      });
      const updated = await deps.providerCredential.update({
        where: { id: existing.id },
        data: {
          status: result === 'ok' ? 'active' : 'invalid',
          lastProbedAt: new Date(),
          lastProbeResult: result
        }
      });

      await deps.auditLog?.create?.({
        data: {
          tenantId: params.data.tenantId,
          userId: actorId,
          action: 'provider_credential.probed',
          entityType: 'providerCredential',
          entityId: updated.id,
          metadata: {
            capability: updated.capability,
            provider: updated.provider,
            mode: updated.mode,
            secretHint: updated.secretHint,
            status: updated.status,
            result,
            sourceRoute: '/tenants/:tenantId/provider-credentials/:credentialId/probe'
          }
        }
      });

      const body = toPublicCredential(updated);
      assertNoSecretLeak(body);
      return reply.code(200).send(body);
    }
  );
};
