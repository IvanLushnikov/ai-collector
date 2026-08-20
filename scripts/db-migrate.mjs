#!/usr/bin/env node
/**
 * Production/local schema sync.
 *
 * Source of truth: src/db/prisma/schema.prisma via `prisma db push`
 * WITHOUT --accept-data-loss (refuses destructive resets).
 *
 * Hand-written SQL under src/db/migrations is kept as historical archive.
 * Early SQL used UUID tenant ids; later Prisma-generated SQL used TEXT —
 * applying the folder end-to-end is unsafe. Do not enable SQL replay in prod.
 *
 * Never drops the production database.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

loadEnv();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = path.join(ROOT, 'src/db/prisma/schema.prisma');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

console.log('Syncing Prisma schema (db push, non-destructive)...');
const result = spawnSync(
  'npx',
  ['prisma', 'db', 'push', `--schema=${SCHEMA}`, '--skip-generate'],
  {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit'
  }
);

if (result.status !== 0) {
  console.error('prisma db push failed — refusing destructive schema changes. Inspect the diff and apply manually.');
  process.exit(result.status ?? 1);
}

console.log('Database schema sync complete');
