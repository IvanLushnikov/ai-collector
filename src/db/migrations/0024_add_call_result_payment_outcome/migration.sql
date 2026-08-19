CREATE TYPE IF NOT EXISTS "PaymentOutcome" AS ENUM (
  'none',
  'promised',
  'received',
  'unmatched'
);

ALTER TABLE "CallResult"
  ADD COLUMN IF NOT EXISTS "paymentOutcome" "PaymentOutcome" NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "paymentReceivedAt" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "paymentAmount" DECIMAL;
