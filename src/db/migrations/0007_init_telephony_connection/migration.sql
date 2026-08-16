CREATE TYPE IF NOT EXISTS "TelephonyMode" AS ENUM ('sandbox', 'production');
CREATE TYPE IF NOT EXISTS "TelephonyStatus" AS ENUM ('active', 'disabled', 'invalid');

CREATE TABLE IF NOT EXISTS "TelephonyConnection" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "mode" "TelephonyMode" NOT NULL DEFAULT 'production',
  "status" "TelephonyStatus" NOT NULL DEFAULT 'active',
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_telephony_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
