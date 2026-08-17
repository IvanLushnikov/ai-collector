import { describe, expect, it } from 'vitest';
import { createInMemoryCredentialSecretStore } from '../../src/secrets/credential-store.js';

describe('credential secret store', () => {
  it('puts and gets ciphertext by providerCredentialId and tenantId', async () => {
    const store = createInMemoryCredentialSecretStore();
    await store.put({
      tenantId: 'tenant-a',
      providerCredentialId: 'cred-1',
      ciphertext: Buffer.from('cipher'),
      nonce: Buffer.alloc(12, 1),
      authTag: Buffer.alloc(16, 2)
    });

    const row = await store.get('tenant-a', 'cred-1');
    expect(row?.ciphertext.toString()).toBe('cipher');
    expect(row?.nonce).toHaveLength(12);
  });

  it('returns empty for another tenant instead of the foreign secret', async () => {
    const store = createInMemoryCredentialSecretStore();
    await store.put({
      tenantId: 'tenant-a',
      providerCredentialId: 'cred-1',
      ciphertext: Buffer.from('cipher'),
      nonce: Buffer.alloc(12, 1),
      authTag: Buffer.alloc(16, 2)
    });

    expect(await store.get('tenant-b', 'cred-1')).toBeNull();
  });

  it('deletes only the matching tenant row', async () => {
    const store = createInMemoryCredentialSecretStore();
    await store.put({
      tenantId: 'tenant-a',
      providerCredentialId: 'cred-1',
      ciphertext: Buffer.from('cipher'),
      nonce: Buffer.alloc(12, 1),
      authTag: Buffer.alloc(16, 2)
    });

    expect(await store.delete('tenant-b', 'cred-1')).toBe(false);
    expect(await store.get('tenant-a', 'cred-1')).not.toBeNull();
    expect(await store.delete('tenant-a', 'cred-1')).toBe(true);
    expect(await store.get('tenant-a', 'cred-1')).toBeNull();
  });
});
