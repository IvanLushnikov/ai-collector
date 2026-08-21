import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { extractZipEntries } from '../../src/import/xlsx-parser.js';
import { SESSION_COOKIE_NAME, hashSessionToken } from '../../src/auth/session-token.js';

const tenantId = '11111111-1111-1111-1111-111111111111';
const campaignId = '22222222-2222-2222-2222-222222222222';
const otherTenantId = '33333333-3333-3333-3333-333333333333';

const makeSessionStore = (roleName: string) => {
  const tokenRaw = 'a'.repeat(64);
  const tokenHash = hashSessionToken(tokenRaw);
  return {
    tokenRaw,
    cookie: `${SESSION_COOKIE_NAME}=${tokenRaw}`,
    store: {
      session: {
        findFirst: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
          if (where.tokenHash !== tokenHash) {
            return null;
          }
          return {
            id: 'session-1',
            tokenHash,
            userId: 'user-viewer',
            tenantId,
            roleName,
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null
          };
        }),
        create: vi.fn(),
        update: vi.fn()
      },
      user: {
        findFirst: vi.fn(async () => ({
          id: 'user-viewer',
          tenantId,
          role: { name: roleName }
        }))
      },
      tenantMembership: {
        findFirst: vi.fn(async () => ({ roleName }))
      },
      platformMembership: {
        findFirst: vi.fn(async () => null)
      },
      supportAccessGrant: {
        findFirst: vi.fn(async () => null)
      },
      tenant: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => (
          where.id === tenantId || where.id === otherTenantId ? { id: where.id } : null
        ))
      },
      campaign: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
          id: where.id,
          tenantId
        })),
        update: vi.fn()
      },
      scriptVersion: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        create: vi.fn()
      },
      callAttempt: {
        findMany: vi.fn(async () => []),
        count: vi.fn(async () => 0)
      },
      complianceDecision: {
        findMany: vi.fn(async () => [])
      },
      callResult: {
        update: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      }
    }
  };
};

describe('security regressions', () => {
  it('does not elevate review-item access via X-User-Role even when header identity is enabled', async () => {
    const { cookie, store } = makeSessionStore('tenant_viewer');
    const app = createApp({
      campaignStore: store as any,
      allowHeaderIdentity: true
    });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/review-items`,
      headers: {
        cookie,
        'x-user-role': 'tenant_owner'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');
    await app.close();
  });

  it('allows compliance_officer to pass authz for compliance check', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn(async () => ({ id: tenantId })) },
        campaign: { findUnique: vi.fn(async () => ({ id: campaignId, tenantId })) },
        debtorRecord: { findUnique: vi.fn(async () => null) },
        user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
        session: { findFirst: vi.fn(async () => null) }
      } as any,
      allowHeaderIdentity: true
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/debtors/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/compliance/check`,
      headers: { 'x-user-role': 'compliance_officer' }
    });

    // Authz must pass; missing debtor yields 404 rather than 403.
    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('DEBTOR_RECORD_NOT_FOUND');
    await app.close();
  });

  it('rejects script writes for tenant_viewer', async () => {
    const { cookie, store } = makeSessionStore('tenant_viewer');
    const app = createApp({
      campaignStore: store as any,
      allowHeaderIdentity: false
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/campaigns/${campaignId}/scripts`,
      headers: { cookie },
      payload: {
        content: {
          agentName: 'Anna',
          agentId: 'agent-1',
          creditorName: 'Example Bank'
        }
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('FORBIDDEN');
    await app.close();
  });

  it('accepts telephony webhooks without session when secret is valid', async () => {
    const webhookSecret = 'test-webhook-secret';
    const webhookSecretHash = createHash('sha256').update(webhookSecret).digest('hex');
    const store = {
      tenant: { findUnique: vi.fn(async () => ({ id: 'tenant-1' })) },
      user: { findFirst: vi.fn(async () => ({ id: 'user-1' })) },
      telephonyConnection: {
        findMany: vi.fn(async () => [{ id: 'connection-1', webhookSecretHash }])
      },
      webhookInboxEvent: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
      },
      callAttempt: {
        findFirst: vi.fn(async () => null),
        updateMany: vi.fn(async () => ({ count: 0 }))
      },
      callEvent: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data)
      },
      session: {
        findFirst: vi.fn(async () => null)
      }
    };

    const app = createApp({
      campaignStore: store as any,
      allowHeaderIdentity: false
    });
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/tenants/tenant-1/telephony/webhooks/mango',
      headers: {
        'x-telephony-webhook-secret': webhookSecret
      },
      payload: {
        eventId: 'evt-prod-1',
        providerCallId: 'provider-1',
        status: 'completed',
        occurredAt: '2026-08-19T09:00:00.000Z'
      }
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({ accepted: true });
    await app.close();
  });

  it('does not send credentials with wildcard CORS', async () => {
    const app = createApp({
      campaignStore: {
        tenant: { findUnique: vi.fn() },
        user: { findFirst: vi.fn() },
        session: { findFirst: vi.fn(async () => null) }
      } as any,
      allowHeaderIdentity: true,
      corsOrigins: '*'
    });
    await app.ready();

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/healthz',
      headers: {
        origin: 'https://evil.example'
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    await app.close();
  });

  it('caps zip bomb inflation for xlsx imports', () => {
    const uncompressed = Buffer.alloc(2 * 1024 * 1024, 0x41);
    const compressed = deflateRawSync(uncompressed);
    const name = Buffer.from('xl/worksheets/sheet1.xml');
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(1024, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    const zip = Buffer.concat([localHeader, name, compressed]);

    expect(() => extractZipEntries(zip)).toThrow(/IMPORT_TOO_LARGE|safely decompressed/);
  });
});
