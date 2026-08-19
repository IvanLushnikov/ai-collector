import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/password.js';

describe('password hashing', () => {
  it('hashes a password and verifies the same value', async () => {
    const hash = await hashPassword('correct-horse-battery');
    expect(hash).not.toBe('correct-horse-battery');
    expect(hash.length).toBeGreaterThan(20);
    await expect(verifyPassword(hash, 'correct-horse-battery')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-horse-battery');
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });
});
