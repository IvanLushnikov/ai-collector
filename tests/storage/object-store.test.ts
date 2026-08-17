import { describe, expect, it } from 'vitest';
import { createFakeObjectStore } from '../../src/storage/fake-object-store.js';

describe('fake object store', () => {
  it('puts and gets with a tenant prefix and no network', async () => {
    const store = createFakeObjectStore();
    const audio = new Uint8Array([1, 2, 3]);
    const put = await store.put({
      tenantId: 'tenant-a',
      kind: 'recording',
      bytes: audio,
      contentType: 'audio/mpeg',
      keyHint: 'call-1'
    });

    expect(put.url).toBe('sandbox://recording/tenant-a/call-1');
    const got = await store.get(put.url);
    expect(got?.contentType).toBe('audio/mpeg');
    expect(Array.from(got?.bytes ?? [])).toEqual([1, 2, 3]);
    expect(await store.get('sandbox://recording/tenant-b/call-1')).toBeNull();
  });
});
