import { describe, expect, it } from 'vitest';
import { applyWebhookEvent, createInMemoryWebhookInbox } from '../../src/integrations/webhook-inbox.js';

describe('webhook inbox', () => {
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
