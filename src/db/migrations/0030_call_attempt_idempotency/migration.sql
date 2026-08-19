ALTER TABLE "CallAttempt"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CallAttempt_tenantId_idempotencyKey_key"
  ON "CallAttempt" ("tenantId", "idempotencyKey");
