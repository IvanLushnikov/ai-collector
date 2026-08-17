ALTER TABLE "CallAttempt"
  ADD COLUMN IF NOT EXISTS "scriptVersionId" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_call_attempt_script_version'
  ) THEN
    ALTER TABLE "CallAttempt"
      ADD CONSTRAINT "fk_call_attempt_script_version"
      FOREIGN KEY ("scriptVersionId")
      REFERENCES "ScriptVersion"("id")
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_call_attempt_script_version"
  ON "CallAttempt" ("scriptVersionId");
