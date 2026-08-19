import { describe, expect, it, vi } from 'vitest';
import { applyMigrations, collectMigrationFiles } from '../../scripts/apply-migrations.js';

describe('SQL migration runner', () => {
  it('discovers immutable migration files in lexical order', () => {
    const migrations = collectMigrationFiles();

    expect(migrations.length).toBeGreaterThanOrEqual(30);
    expect(migrations.map((migration) => migration.id)).toEqual([...migrations.map((migration) => migration.id)].sort());
    expect(migrations.at(-1)).toMatchObject({ id: '0030_call_attempt_idempotency' });
    expect(migrations.every((migration) => migration.sql.trim().length > 0 && migration.checksum.length === 64)).toBe(true);
  });

  it('records each migration in the same transaction as its SQL and rejects changed history', async () => {
    const execute = vi.fn(async () => 1);
    const transaction = vi.fn(async (callback: (transactionClient: unknown) => Promise<void>) => callback({ $executeRawUnsafe: execute }));
    const client = {
      $executeRawUnsafe: execute,
      $queryRawUnsafe: vi.fn(async () => []),
      $transaction: transaction
    };

    await applyMigrations(client as any);

    expect(transaction).toHaveBeenCalledTimes(30);
    expect(execute).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "AppSchemaMigration"'));
    expect(execute).toHaveBeenLastCalledWith(
      'INSERT INTO "AppSchemaMigration" ("id", "checksum") VALUES ($1, $2)',
      '0030_call_attempt_idempotency',
      expect.any(String)
    );

    await expect(applyMigrations({
      ...client,
      $queryRawUnsafe: vi.fn(async () => [{ id: '0001_init_tenant', checksum: 'changed' }])
    } as any)).rejects.toThrow('Migration checksum mismatch: 0001_init_tenant');
  });
});
