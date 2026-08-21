ALTER TABLE "OutboxEvent"
  ADD COLUMN IF NOT EXISTS "deadLetteredAt" TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS "OutboxEvent_deadLetteredAt_availableAt_idx"
  ON "OutboxEvent" ("deadLetteredAt", "availableAt");
