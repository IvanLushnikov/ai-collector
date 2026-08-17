import { describe, expect, it } from 'vitest';
import {
  decryptSecret,
  encryptSecret,
  EnvelopeKeyError,
  parseDekHex,
  secretHintFromKey
} from '../../src/secrets/envelope.js';

const DEK = parseDekHex('a'.repeat(64));

describe('envelope AES-256-GCM', () => {
  it('roundtrips plaintext', () => {
    const payload = encryptSecret('sk-test-secret', DEK);
    expect(payload.nonce).toHaveLength(12);
    expect(payload.authTag).toHaveLength(16);
    expect(decryptSecret(payload, DEK)).toBe('sk-test-secret');
  });

  it('throws on a foreign nonce instead of returning garbage', () => {
    const payload = encryptSecret('secret', DEK);
    payload.nonce = Buffer.from(payload.nonce);
    payload.nonce[0] ^= 0xff;
    expect(() => decryptSecret(payload, DEK)).toThrow();
  });

  it('throws on a foreign key instead of returning garbage', () => {
    const payload = encryptSecret('secret', DEK);
    const otherDek = parseDekHex('b'.repeat(64));
    expect(() => decryptSecret(payload, otherDek)).toThrow();
  });

  it('throws on a tampered auth tag instead of returning garbage', () => {
    const payload = encryptSecret('secret', DEK);
    payload.authTag = Buffer.from(payload.authTag);
    payload.authTag[0] ^= 0xff;
    expect(() => decryptSecret(payload, DEK)).toThrow();
  });

  it('returns the last 4 characters for keys longer than 4', () => {
    expect(secretHintFromKey('AQVN4242')).toBe('4242');
  });

  it('masks short keys as ****', () => {
    expect(secretHintFromKey('ab')).toBe('****');
  });

  it('rejects a short DEK', () => {
    expect(() => encryptSecret('x', Buffer.alloc(16))).toThrow(EnvelopeKeyError);
  });
});
