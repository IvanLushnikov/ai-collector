ALTER TABLE "Campaign"
  ADD COLUMN IF NOT EXISTS "telephonyConnectionId" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_campaign_telephony_connection'
  ) THEN
    ALTER TABLE "Campaign"
      ADD CONSTRAINT "fk_campaign_telephony_connection"
      FOREIGN KEY ("telephonyConnectionId")
      REFERENCES "TelephonyConnection"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_campaign_telephony_connection"
  ON "Campaign" ("telephonyConnectionId");
