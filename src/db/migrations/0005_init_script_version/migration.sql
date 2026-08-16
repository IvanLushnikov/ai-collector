CREATE TYPE IF NOT EXISTS "ScriptStatus" AS ENUM ('draft', 'active', 'archived');

CREATE TABLE IF NOT EXISTS "ScriptVersion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ScriptStatus" NOT NULL DEFAULT 'draft',
  "content" TEXT NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_script_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_script_campaign" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_script_creator" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT,
  CONSTRAINT "uq_script_campaign_version" UNIQUE ("campaignId", "version")
);
