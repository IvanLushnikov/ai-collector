import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/server/app.js';

describe('audit metadata previous/next value (OP-T-003)', () => {
  it('writes previousValue and nextValue on campaign status change', async () => {
    const auditCreate = vi.fn(async () => ({ id: 'audit-1' }));
    const campaignStore: any = {
      tenant: {
        findUnique: vi.fn(async () => ({ id: '11111111-1111-1111-1111-111111111111', legalBasisStatus: 'confirmed' }))
      },
      user: {
        findFirst: vi.fn(async () => ({ id: 'user-1' }))
      },
      campaign: {
        create: vi.fn(),
        findUnique: vi.fn(async () => ({
          id: 'campaign-run',
          tenantId: '11111111-1111-1111-1111-111111111111',
          status: 'running'
        })),
        update: vi.fn(async ({ data, where }: { data: { status: string }; where: { id: string } }) => ({
          id: where.id,
          tenantId: '11111111-1111-1111-1111-111111111111',
          name: 'Running',
          status: data.status,
          timezone: 'UTC',
          createdAt: '2026-08-16T09:00:00.000Z'
        }))
      },
      auditLog: { create: auditCreate }
    };

    const app = createApp({ campaignStore });
    await app.ready();

    const response = await app.inject({
      method: 'PATCH',
      url: '/tenants/11111111-1111-1111-1111-111111111111/campaigns/campaign-run/status',
      headers: { 'X-User-Role': 'owner' },
      payload: { status: 'completed', stopMode: 'graceful' }
    });

    expect(response.statusCode).toBe(200);
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'campaign.status_updated',
        metadata: expect.objectContaining({
          fromStatus: 'running',
          toStatus: 'completed',
          previousValue: 'running',
          nextValue: 'completed',
          reason: 'graceful'
        })
      })
    });

    await app.close();
  });
});
