import { randomUUID } from 'node:crypto';

export type CredentialSecretRecord = {
  id: string;
  tenantId: string;
  providerCredentialId: string;
  ciphertext: Buffer;
  nonce: Buffer;
  authTag: Buffer;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PutCredentialSecretInput = {
  tenantId: string;
  providerCredentialId: string;
  ciphertext: Buffer;
  nonce: Buffer;
  authTag: Buffer;
  keyVersion?: number;
};

export type CredentialSecretStore = {
  put: (input: PutCredentialSecretInput) => Promise<CredentialSecretRecord>;
  get: (tenantId: string, providerCredentialId: string) => Promise<CredentialSecretRecord | null>;
  delete: (tenantId: string, providerCredentialId: string) => Promise<boolean>;
};

export const createInMemoryCredentialSecretStore = (): CredentialSecretStore => {
  const rows = new Map<string, CredentialSecretRecord>();

  return {
    async put(input) {
      const existing = rows.get(input.providerCredentialId);
      const now = new Date();
      const record: CredentialSecretRecord = {
        id: existing?.id ?? randomUUID(),
        tenantId: input.tenantId,
        providerCredentialId: input.providerCredentialId,
        ciphertext: Buffer.from(input.ciphertext),
        nonce: Buffer.from(input.nonce),
        authTag: Buffer.from(input.authTag),
        keyVersion: input.keyVersion ?? existing?.keyVersion ?? 1,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      rows.set(input.providerCredentialId, record);
      return record;
    },
    async get(tenantId, providerCredentialId) {
      const row = rows.get(providerCredentialId);
      if (!row || row.tenantId !== tenantId) {
        return null;
      }
      return row;
    },
    async delete(tenantId, providerCredentialId) {
      const row = rows.get(providerCredentialId);
      if (!row || row.tenantId !== tenantId) {
        return false;
      }
      rows.delete(providerCredentialId);
      return true;
    }
  };
};

const toRecord = (row: {
  id: string;
  tenantId: string;
  providerCredentialId: string;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  authTag: Uint8Array;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): CredentialSecretRecord => ({
  id: row.id,
  tenantId: row.tenantId,
  providerCredentialId: row.providerCredentialId,
  ciphertext: Buffer.from(row.ciphertext),
  nonce: Buffer.from(row.nonce),
  authTag: Buffer.from(row.authTag),
  keyVersion: row.keyVersion,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

export const createPrismaCredentialSecretStore = (client: {
  credentialSecret: {
    findUnique: (args: { where: { providerCredentialId: string } }) => Promise<{
      id: string;
      tenantId: string;
      providerCredentialId: string;
      ciphertext: Uint8Array;
      nonce: Uint8Array;
      authTag: Uint8Array;
      keyVersion: number;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
    upsert: (args: {
      where: { providerCredentialId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<{
      id: string;
      tenantId: string;
      providerCredentialId: string;
      ciphertext: Uint8Array;
      nonce: Uint8Array;
      authTag: Uint8Array;
      keyVersion: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    deleteMany: (args: {
      where: { providerCredentialId: string; tenantId: string };
    }) => Promise<{ count: number }>;
  };
}): CredentialSecretStore => ({
  async put(input) {
    const row = await client.credentialSecret.upsert({
      where: { providerCredentialId: input.providerCredentialId },
      create: {
        tenantId: input.tenantId,
        providerCredentialId: input.providerCredentialId,
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        authTag: input.authTag,
        keyVersion: input.keyVersion ?? 1
      },
      update: {
        tenantId: input.tenantId,
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        authTag: input.authTag,
        keyVersion: input.keyVersion ?? 1
      }
    });
    return toRecord(row);
  },
  async get(tenantId, providerCredentialId) {
    const row = await client.credentialSecret.findUnique({
      where: { providerCredentialId }
    });
    if (!row || row.tenantId !== tenantId) {
      return null;
    }
    return toRecord(row);
  },
  async delete(tenantId, providerCredentialId) {
    const result = await client.credentialSecret.deleteMany({
      where: { providerCredentialId, tenantId }
    });
    return result.count > 0;
  }
});

