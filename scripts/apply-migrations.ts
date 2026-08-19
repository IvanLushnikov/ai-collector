import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

type SqlMigration = {
  id: string;
  sql: string;
  checksum: string;
};

const migrationsDirectory = fileURLToPath(new URL('../src/db/migrations/', import.meta.url));

export const collectMigrationFiles = (): SqlMigration[] => readdirSync(migrationsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .map((id) => {
    const sql = readFileSync(resolve(migrationsDirectory, id, 'migration.sql'), 'utf8');
    return {
      id,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex')
    };
  });

export const applyMigrations = async (client: PrismaClient): Promise<void> => {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppSchemaMigration" (
      "id" TEXT PRIMARY KEY,
      "checksum" CHAR(64) NOT NULL,
      "appliedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await client.$queryRawUnsafe<Array<{ id: string; checksum: string }>>(
    'SELECT "id", "checksum" FROM "AppSchemaMigration"'
  );
  const appliedById = new Map(applied.map((migration) => [migration.id, migration.checksum]));

  for (const migration of collectMigrationFiles()) {
    const previousChecksum = appliedById.get(migration.id);
    if (previousChecksum) {
      if (previousChecksum !== migration.checksum) {
        throw new Error(`Migration checksum mismatch: ${migration.id}`);
      }
      continue;
    }

    await client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(migration.sql);
      await tx.$executeRawUnsafe(
        'INSERT INTO "AppSchemaMigration" ("id", "checksum") VALUES ($1, $2)',
        migration.id,
        migration.checksum
      );
    });
  }
};

const main = async (): Promise<void> => {
  const client = new PrismaClient();
  try {
    await applyMigrations(client);
  } finally {
    await client.$disconnect();
  }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
