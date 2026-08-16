CREATE TYPE IF NOT EXISTS "ComplianceDecisionStatus" AS ENUM ('allow', 'block');

CREATE TABLE IF NOT EXISTS "ComplianceDecision" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "debtorRecordId" UUID NOT NULL,
  "decision" "ComplianceDecisionStatus" NOT NULL DEFAULT 'allow',
  "reasonCode" TEXT NOT NULL,
  "reasonText" TEXT NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "checkedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "fk_compliance_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_compliance_campaign" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_compliance_debtor" FOREIGN KEY ("debtorRecordId") REFERENCES "DebtorRecord"("id") ON DELETE CASCADE
);
