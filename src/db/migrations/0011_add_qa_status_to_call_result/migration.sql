CREATE TYPE IF NOT EXISTS "CallResultQaStatus" AS ENUM (
  'not_reviewed',
  'approved',
  'flagged'
);

ALTER TABLE "CallResult"
  ADD COLUMN IF NOT EXISTS "qaStatus" "CallResultQaStatus" NOT NULL DEFAULT 'not_reviewed';
