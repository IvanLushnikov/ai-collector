CREATE TABLE IF NOT EXISTS "OutboxEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "lockedAt" TIMESTAMP WITH TIME ZONE,
  "lockedBy" TEXT,
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "lastError" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_outbox_event_tenant"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "OutboxEvent_processedAt_availableAt_idx"
  ON "OutboxEvent" ("processedAt", "availableAt");
CREATE INDEX IF NOT EXISTS "OutboxEvent_tenantId_createdAt_idx"
  ON "OutboxEvent" ("tenantId", "createdAt");
