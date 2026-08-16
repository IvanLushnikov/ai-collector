CREATE TYPE IF NOT EXISTS "UsageEventType" AS ENUM (
  'call_started',
  'call_completed',
  'call_failed',
  'handoff',
  'transcript_generated'
);

CREATE TABLE IF NOT EXISTS "UsageEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "eventType" "UsageEventType" NOT NULL,
  "quantity" NUMERIC NOT NULL,
  "unit" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL UNIQUE,
  "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_usage_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_usage_campaign" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE
);
