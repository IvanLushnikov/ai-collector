import { describe, expect, it } from 'vitest';
import { applyWebhookEvent, createInMemoryWebhookInbox, createPrismaWebhookInbox } from '../../src/integrations/webhook-inbox.js';
import { vi } from 'vitest';

describe('webhook inbox', () => {
  it('uses the database unique key as the durable duplicate gate', async () => {
    const create = vi.fn(async () => ({ id: 'inbox-1' }));
    const inbox = createPrismaWebhookInbox({ webhookInboxEvent: { create } });

    await expect(inbox.insertIfNew({
      tenantId: 'tenant-1',
      sourceSystem: 'exolve',
      eventId: 'event-1'
    })).resolves.toEqual({ duplicate: false });
    expect(create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', sourceSystem: 'exolve', eventId: 'event-1' }
    });
  });

  it('applies the first event and no-ops a duplicate eventId', async () => {
    const inbox = createInMemoryWebhookInbox();
    let updates = 0;
    const first = await applyWebhookEvent(inbox, {
      tenantId: 'tenant-a',
      sourceSystem: 'exolve',
      eventId: 'evt-1'
    }, async () => {
      updates += 1;
      return 'ok';
    });
    const second = await applyWebhookEvent(inbox, {
      tenantId: 'tenant-a',
      sourceSystem: 'exolve',
      eventId: 'evt-1'
    }, async () => {
      updates += 1;
      return 'ok';
    });

    expect(first).toEqual({ duplicate: false, result: 'ok' });
    expect(second).toEqual({ duplicate: true, result: null });
    expect(updates).toBe(1);
  });

  it('isolates the same eventId across tenants', async () => {
    const inbox = createInMemoryWebhookInbox();
    const a = await applyWebhookEvent(inbox, {
      tenantId: 'tenant-a',
      sourceSystem: 'exolve',
      eventId: 'evt-1'
    }, async () => 'a');
    const b = await applyWebhookEvent(inbox, {
      tenantId: 'tenant-b',
      sourceSystem: 'exolve',
      eventId: 'evt-1'
    }, async () => 'b');
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(false);
  });
});
