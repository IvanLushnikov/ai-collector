CREATE TABLE IF NOT EXISTS "FrequencyLedgerAttempt" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "callAttemptId" UUID NOT NULL UNIQUE,
  "tenantId" UUID NOT NULL,
  "creditorKey" TEXT NOT NULL,
  "obligationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_frequency_ledger_attempt_tenant"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "FrequencyLedgerAttempt_tenantId_creditorKey_obligationId_occurredAt_idx"
  ON "FrequencyLedgerAttempt" ("tenantId", "creditorKey", "obligationId", "occurredAt");
