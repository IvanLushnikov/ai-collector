CREATE TYPE IF NOT EXISTS "DebtStatus" AS ENUM (
  'active',
  'closed',
  'disputed',
  'bankruptcy',
  'contact_forbidden'
);

CREATE TYPE IF NOT EXISTS "ConsentStatus" AS ENUM (
  'pending',
  'given',
  'revoked'
);

CREATE TABLE IF NOT EXISTS "DebtorRecord" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "externalId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "timezone" TEXT,
  "debtAmount" NUMERIC NOT NULL,
  "debtStatus" "DebtStatus" NOT NULL DEFAULT 'active',
  "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_debtor_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_debtor_campaign" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_debtor_external" UNIQUE ("tenantId", "campaignId", "externalId")
);
