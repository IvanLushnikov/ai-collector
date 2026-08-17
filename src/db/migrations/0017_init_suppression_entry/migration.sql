CREATE TABLE IF NOT EXISTS "SuppressionEntry" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "phone" TEXT,
  "externalId" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_suppression_entry_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SuppressionEntry_tenantId_phone_key"
  ON "SuppressionEntry" ("tenantId", "phone")
  WHERE "phone" IS NOT NULL AND btrim("phone") <> '';

CREATE UNIQUE INDEX IF NOT EXISTS "SuppressionEntry_tenantId_externalId_key"
  ON "SuppressionEntry" ("tenantId", "externalId")
  WHERE "externalId" IS NOT NULL AND btrim("externalId") <> '';
