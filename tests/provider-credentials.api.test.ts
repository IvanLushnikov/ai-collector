import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';
import type { ProviderCredential } from '../src/domain/provider-credential/index.js';
import { createInMemoryCredentialSecretStore } from '../src/secrets/credential-store.js';
import { parseDekHex } from '../src/secrets/envelope.js';
import { resolveSpeechCredential } from '../src/speech/credentials/resolve.js';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT_ID = '22222222-2222-2222-2222-222222222222';
const DEK = parseDekHex('a'.repeat(64));
const API_KEY = 'AQVN-secret-4242';

type AuditRow = {
  action: string;
  metadata: Record<string, unknown>;
};

const makeStore = () => {
  const credentials: ProviderCredential[] = [];
  const audit: AuditRow[] = [];
  const secretStore = createInMemoryCredentialSecretStore();

  return {
    credentials,
    audit,
    secretStore,
    dek: DEK,
    tenant: {
      findUnique: async (query: { where: { id: string } }) => (
        query.where.id === TENANT_ID || query.where.id === OTHER_TENANT_ID
          ? { id: query.where.id }
          : null
      )
    },
    user: {
      findFirst: async () => ({ id: 'user-1' })
    },
    providerCredential: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: randomUUID(),
          createdAt: new Date('2026-08-17T10:00:00.000Z'),
          updatedAt: new Date('2026-08-17T10:00:00.000Z'),
          ...data
        } as ProviderCredential;
        credentials.push(row);
        return row;
      },
      findMany: async ({ where }: { where: { tenantId: string } }) =>
        credentials.filter((row) => row.tenantId === where.tenantId),
      findFirst: async ({ where }: { where: Record<string, unknown> }) =>
        credentials.find((row) => Object.entries(where).every(([key, value]) => (row as Record<string, unknown>)[key] === value)) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) =>
        credentials.find((row) => row.id === where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const index = credentials.findIndex((row) => row.id === where.id);
        credentials[index] = {
          ...credentials[index],
          ...data,
          updatedAt: new Date('2026-08-17T11:00:00.000Z')
        } as ProviderCredential;
        return credentials[index];
      }
    },
    auditLog: {
      create: async ({ data }: { data: AuditRow }) => {
        audit.push(data);
        return data;
      }
    }
  };
};

const headers = (role = 'owner') => ({
  'x-user-role': role,
  'content-type': 'application/json'
});

describe('Provider Credentials API', () => {
  it('creates a byok credential without returning the apiKey', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit ФинЛиния',
        apiKey: API_KEY,
        metadata: { folderId: 'b1g' }
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.apiKey).toBeUndefined();
    expect(body.ciphertext).toBeUndefined();
    expect(body.secretHint).toBe('4242');
    expect(body.status).toBe('pending_probe');
    expect(JSON.stringify(body)).not.toContain(API_KEY);
    expect(await store.secretStore.get(TENANT_ID, body.id)).not.toBeNull();
    expect(store.audit[0]?.action).toBe('provider_credential.created');
    expect(JSON.stringify(store.audit[0]?.metadata)).not.toContain(API_KEY);

    await app.close();
  });

  it('lists credentials without secrets and isolates tenants', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit',
        apiKey: API_KEY
      }
    });

    const own = await app.inject({
      method: 'GET',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers('collection_manager')
    });
    expect(own.statusCode).toBe(200);
    expect(own.json()).toHaveLength(1);
    expect(JSON.stringify(own.json())).not.toContain('ciphertext');
    expect(JSON.stringify(own.json())).not.toContain(API_KEY);

    const other = await app.inject({
      method: 'GET',
      url: `/tenants/${OTHER_TENANT_ID}/provider-credentials`,
      headers: headers()
    });
    expect(other.statusCode).toBe(200);
    expect(other.json()).toEqual([]);

    await app.close();
  });

  it('rejects a second credential for the same capability', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const payload = {
      capability: 'asr',
      provider: 'yandex_speechkit',
      mode: 'byok',
      displayName: 'SpeechKit',
      apiKey: API_KEY
    };
    await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload
    });
    const duplicate = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toEqual({ error: 'CREDENTIAL_ALREADY_EXISTS' });

    await app.close();
  });

  it('rejects a foreign provider before writing', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'asr',
        provider: 'openai',
        mode: 'byok',
        displayName: 'OpenAI',
        apiKey: API_KEY
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ error: 'PROVIDER_NOT_ALLOWED' });
    expect(store.credentials).toHaveLength(0);

    await app.close();
  });

  it('rotates the secret and forgets the previous ciphertext', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const created = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'tts',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'Voice',
        apiKey: API_KEY
      }
    });
    const id = created.json().id;
    const previous = await store.secretStore.get(TENANT_ID, id);

    const rotated = await app.inject({
      method: 'PATCH',
      url: `/tenants/${TENANT_ID}/provider-credentials/${id}`,
      headers: headers(),
      payload: { apiKey: 'AQVN-rotated-9999' }
    });

    expect(rotated.statusCode).toBe(200);
    expect(rotated.json().secretHint).toBe('9999');
    expect(rotated.json().status).toBe('pending_probe');
    expect(rotated.json().apiKey).toBeUndefined();
    const next = await store.secretStore.get(TENANT_ID, id);
    expect(next?.ciphertext.equals(previous!.ciphertext)).toBe(false);
    expect(store.audit.some((row) => row.action === 'provider_credential.rotated')).toBe(true);
    expect(JSON.stringify(store.audit)).not.toContain('AQVN-rotated-9999');

    await app.close();
  });

  it('disables a credential so resolver no longer returns the key', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const created = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'llm',
        provider: 'yandexgpt',
        mode: 'byok',
        displayName: 'YandexGPT',
        apiKey: API_KEY
      }
    });
    const id = created.json().id;

    const disabled = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials/${id}/disable`,
      headers: headers(),
      payload: {}
    });
    expect(disabled.statusCode).toBe(200);
    expect(disabled.json().status).toBe('disabled');
    expect(store.audit.some((row) => row.action === 'provider_credential.disabled')).toBe(true);

    await expect(resolveSpeechCredential({
      tenantId: TENANT_ID,
      capability: 'llm',
      credentials: store.credentials,
      secretStore: store.secretStore,
      dek: DEK,
      env: {
        YANDEX_SPEECHKIT_API_KEY: 'platform',
        YANDEXGPT_API_KEY: 'platform-llm',
        GIGACHAT_API_KEY: '',
        YANDEX_FOLDER_ID: ''
      }
    })).rejects.toMatchObject({ code: 'SPEECH_CREDENTIAL_DISABLED' });

    await app.close();
  });

  it('probes a credential and stores ok or failed without returning the key', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const created = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit',
        apiKey: API_KEY
      }
    });
    const id = created.json().id;

    const probed = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials/${id}/probe`,
      headers: headers(),
      payload: {}
    });
    expect(probed.statusCode).toBe(200);
    expect(probed.json().status).toBe('active');
    expect(probed.json().lastProbeResult).toBe('ok');
    expect(probed.json().apiKey).toBeUndefined();
    expect(store.audit.some((row) => row.action === 'provider_credential.probed')).toBe(true);

    await app.close();
  });

  it('enforces RBAC for write and read', async () => {
    const store = makeStore();
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const missingRole = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit',
        apiKey: API_KEY
      }
    });
    expect(missingRole.statusCode).toBe(401);

    const operatorWrite = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers('operator'),
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit',
        apiKey: API_KEY
      }
    });
    expect(operatorWrite.statusCode).toBe(403);

    const qaRead = await app.inject({
      method: 'GET',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers('qa_analyst')
    });
    expect(qaRead.statusCode).toBe(403);

    const owner = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers('owner'),
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit',
        apiKey: API_KEY
      }
    });
    expect(owner.statusCode).toBe(201);

    await app.close();
  });

  it('creates the credential, encrypted secret and audit event in one transaction when supported', async () => {
    const store = makeStore();
    const transaction = vi.fn(async (callback: (transactionStore: unknown) => Promise<unknown>) => callback({
      providerCredential: store.providerCredential,
      credentialSecret: {
        upsert: vi.fn(async ({ create }: { create: Record<string, unknown> }) => ({
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create
        })),
        findUnique: vi.fn(),
        deleteMany: vi.fn()
      },
      auditLog: store.auditLog
    }));
    (store as any).$transaction = transaction;
    const app = createApp({ campaignStore: store as any });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: `/tenants/${TENANT_ID}/provider-credentials`,
      headers: headers(),
      payload: {
        capability: 'asr',
        provider: 'yandex_speechkit',
        mode: 'byok',
        displayName: 'SpeechKit',
        apiKey: API_KEY
      }
    });

    expect(response.statusCode).toBe(201);
    expect(transaction).toHaveBeenCalledOnce();
    expect(store.credentials).toHaveLength(1);
    expect(store.audit).toHaveLength(1);
    await app.close();
  });
});
