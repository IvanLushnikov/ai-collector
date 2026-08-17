CREATE TYPE IF NOT EXISTS "FrequencyBucket" AS ENUM (
  'day',
  'week',
  'month'
);

CREATE TABLE IF NOT EXISTS "FrequencyLedger" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "creditorKey" TEXT NOT NULL,
  "obligationId" TEXT NOT NULL,
  "bucket" "FrequencyBucket" NOT NULL,
  "periodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_frequency_ledger_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "FrequencyLedger_tenantId_creditorKey_obligationId_bucket_periodStart_key"
  ON "FrequencyLedger" ("tenantId", "creditorKey", "obligationId", "bucket", "periodStart");
