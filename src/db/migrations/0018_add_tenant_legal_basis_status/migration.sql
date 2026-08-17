DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegalBasisStatus') THEN
    CREATE TYPE "LegalBasisStatus" AS ENUM ('pending', 'confirmed', 'revoked');
  END IF;
END $$;

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "legalBasisStatus" "LegalBasisStatus" NOT NULL DEFAULT 'pending';
