import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const NONCE_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;

export type EnvelopePayload = {
  ciphertext: Buffer;
  nonce: Buffer;
  authTag: Buffer;
};

export class EnvelopeKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvelopeKeyError';
  }
}

export function parseDekHex(hex: string): Buffer {
  const trimmed = hex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new EnvelopeKeyError('DEK must be 32 bytes hex (64 hex chars)');
  }
  return Buffer.from(trimmed, 'hex');
}

export function encryptSecret(plaintext: string, dek: Buffer): EnvelopePayload {
  if (dek.length !== KEY_BYTES) {
    throw new EnvelopeKeyError('DEK must be 32 bytes');
  }
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, dek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  if (authTag.length !== AUTH_TAG_BYTES) {
    throw new EnvelopeKeyError('authTag must be 16 bytes');
  }
  return { ciphertext, nonce, authTag };
}

export function decryptSecret(payload: EnvelopePayload, dek: Buffer): string {
  if (dek.length !== KEY_BYTES) {
    throw new EnvelopeKeyError('DEK must be 32 bytes');
  }
  const decipher = createDecipheriv(ALGORITHM, dek, payload.nonce);
  decipher.setAuthTag(payload.authTag);
  return Buffer.concat([decipher.update(payload.ciphertext), decipher.final()]).toString('utf8');
}

export function secretHintFromKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length < 4) {
    return '****';
  }
  return trimmed.slice(-4);
}
