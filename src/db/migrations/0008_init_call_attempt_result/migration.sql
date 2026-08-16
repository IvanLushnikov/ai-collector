CREATE TYPE IF NOT EXISTS "CallAttemptStatus" AS ENUM (
  'initiated',
  'queued',
  'ringing',
  'answered',
  'failed',
  'completed',
  'no_answer',
  'blocked'
);

CREATE TYPE IF NOT EXISTS "CallResultOutcome" AS ENUM (
  'not_called',
  'no_answer',
  'callback_requested',
  'wrong_number',
  'ptp_created',
  'handoff',
  'dispute',
  'blocked',
  'error'
);

CREATE TABLE IF NOT EXISTS "CallAttempt" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "debtorRecordId" UUID NOT NULL,
  "telephonyConnectionId" UUID NOT NULL,
  "status" "CallAttemptStatus" NOT NULL DEFAULT 'initiated',
  "providerCallId" TEXT NOT NULL,
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_call_attempt_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_call_attempt_campaign" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_call_attempt_debtor" FOREIGN KEY ("debtorRecordId") REFERENCES "DebtorRecord"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_call_attempt_telephony" FOREIGN KEY ("telephonyConnectionId") REFERENCES "TelephonyConnection"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "CallResult" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "callAttemptId" UUID NOT NULL,
  "outcome" "CallResultOutcome" NOT NULL,
  "ptpAmount" NUMERIC,
  "ptpDate" TIMESTAMP WITH TIME ZONE,
  "reason" TEXT,
  "transcriptUrl" TEXT,
  "recordingUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_call_result_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_call_result_call_attempt" FOREIGN KEY ("callAttemptId") REFERENCES "CallAttempt"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_call_result_call_attempt" UNIQUE ("callAttemptId")
);
