DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromptStatus') THEN
    CREATE TYPE "PromptStatus" AS ENUM ('draft', 'active', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PromptVersion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "scriptVersionId" UUID,
  "version" INTEGER NOT NULL,
  "status" "PromptStatus" NOT NULL DEFAULT 'draft',
  "content" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_prompt_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_prompt_campaign" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_prompt_script" FOREIGN KEY ("scriptVersionId") REFERENCES "ScriptVersion"("id") ON DELETE SET NULL,
  CONSTRAINT "uq_prompt_campaign_version" UNIQUE ("campaignId", "version")
);
