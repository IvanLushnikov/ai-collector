# Database migrations

## Commands

- `npm run db:validate` validates the Prisma schema without connecting to a database.
- `npm run db:generate` regenerates Prisma Client after schema changes.
- `npm run db:migrate` applies ordered SQL from `src/db/migrations`.

## Safety model

`db:migrate` keeps the `AppSchemaMigration` ledger in the target PostgreSQL database. Every migration ID is recorded with a SHA-256 checksum in the same transaction as its SQL. A modified migration that has already been applied stops deployment with a checksum mismatch; add a new migration instead.

Run `db:migrate` once per deployment before starting workers and API instances. Do not use `prisma db push --accept-data-loss` outside disposable development databases: it bypasses the reviewed SQL history and audit trail.

## Rollback

Migrations are forward-only. A rollback is a new, reviewed migration that restores the intended schema or data shape. Before a destructive data migration, take a tested backup and write an explicit recovery runbook.
