-- CreateEnum
CREATE TYPE "CallConversationStatus" AS ENUM (
  'not_started',
  'in_progress',
  'awaiting_recording',
  'awaiting_transcription',
  'transcribed',
  'transcription_failed',
  'recording_missing',
  'review_required',
  'finalized'
);

-- AlterTable
ALTER TABLE "TelephonyConnection" ADD COLUMN "connectionType" TEXT;
ALTER TABLE "TelephonyConnection" ADD COLUMN "transportProfile" TEXT;
ALTER TABLE "TelephonyConnection" ADD COLUMN "capabilityStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "TelephonyConnection" ADD COLUMN "providerDeclaredCapacity" INTEGER;
ALTER TABLE "TelephonyConnection" ADD COLUMN "platformApprovedCapacity" INTEGER;
ALTER TABLE "TelephonyConnection" ADD COLUMN "statusCallbackUrlConfigured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "webhookSecretHash" TEXT;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsRealtimeEvents" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsCdr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsRecording" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsAudioExportForTranscription" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsHandoff" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "supportsMarking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TelephonyConnection" ADD COLUMN "lastHealthcheckAt" TIMESTAMP(3);
ALTER TABLE "TelephonyConnection" ADD COLUMN "lastHealthcheckStatus" TEXT;

-- AlterTable
ALTER TABLE "CallAttempt" ADD COLUMN "dialStatus" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "providerStatusRaw" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "providerStatusUpdatedAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "lastEventAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "answeredAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "hangupAt" TIMESTAMP(3);
ALTER TABLE "CallAttempt" ADD COLUMN "failureReasonCode" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "failureReasonText" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "disconnectInitiator" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "attemptSequence" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CallAttempt" ADD COLUMN "isTestCall" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CallAttempt" ADD COLUMN "reviewRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CallAttempt" ADD COLUMN "reviewReasonCode" TEXT;
ALTER TABLE "CallAttempt" ADD COLUMN "cdrReconciliationStatus" TEXT;

-- AlterTable
ALTER TABLE "CallResult" ADD COLUMN "conversationStatus" "CallConversationStatus" NOT NULL DEFAULT 'not_started';
ALTER TABLE "CallResult" ADD COLUMN "transcriptStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "CallResult" ADD COLUMN "recordingStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "CallResult" ADD COLUMN "recordingDurationSec" INTEGER;
ALTER TABLE "CallResult" ADD COLUMN "talkDurationSec" INTEGER;
ALTER TABLE "CallResult" ADD COLUMN "transcriptId" UUID;
ALTER TABLE "CallResult" ADD COLUMN "recordingAssetId" UUID;
ALTER TABLE "CallResult" ADD COLUMN "outcomeSource" TEXT NOT NULL DEFAULT 'system';

-- CreateTable
CREATE TABLE "CallEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "callAttemptId" UUID NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventSource" TEXT NOT NULL,
  "normalizedStatus" TEXT,
  "rawStatus" TEXT,
  "payloadRef" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isTerminal" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallTranscript" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "callAttemptId" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "provider" TEXT,
  "language" TEXT,
  "version" TEXT,
  "storageUrl" TEXT,
  "summary" TEXT,
  "confidenceSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CallTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallTranscriptSegment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "transcriptId" UUID NOT NULL,
  "speaker" TEXT NOT NULL,
  "startedAtMs" INTEGER NOT NULL,
  "endedAtMs" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  "channel" TEXT,
  "sequence" INTEGER NOT NULL,

  CONSTRAINT "CallTranscriptSegment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CallTranscriptSegment_transcriptId_sequence_key" UNIQUE ("transcriptId", "sequence")
);

-- CreateTable
CREATE TABLE "CallRecordingAsset" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "callAttemptId" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "storageUrl" TEXT,
  "durationSec" INTEGER,
  "format" TEXT,
  "checksum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CallRecordingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallReconciliationIssue" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "callAttemptId" UUID,
  "providerCallId" TEXT NOT NULL,
  "issueType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "providerValue" TEXT,
  "platformValue" TEXT,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,

  CONSTRAINT "CallReconciliationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallEvent_tenantId_callAttemptId_occurredAt_idx" ON "CallEvent"("tenantId", "callAttemptId", "occurredAt");
CREATE INDEX "CallTranscript_tenantId_idx" ON "CallTranscript"("tenantId");
CREATE INDEX "CallRecordingAsset_tenantId_idx" ON "CallRecordingAsset"("tenantId");
CREATE INDEX "CallReconciliationIssue_tenantId_detectedAt_idx" ON "CallReconciliationIssue"("tenantId", "detectedAt");
CREATE INDEX "CallReconciliationIssue_callAttemptId_idx" ON "CallReconciliationIssue"("callAttemptId");
CREATE INDEX "CallReconciliationIssue_tenantId_providerCallId_idx" ON "CallReconciliationIssue"("tenantId", "providerCallId");
CREATE UNIQUE INDEX "CallResult_transcriptId_key" ON "CallResult"("transcriptId");
CREATE UNIQUE INDEX "CallResult_recordingAssetId_key" ON "CallResult"("recordingAssetId");
CREATE UNIQUE INDEX "CallResult_tenantId_transcriptId_key" ON "CallResult"("tenantId", "transcriptId");
CREATE UNIQUE INDEX "CallResult_tenantId_recordingAssetId_key" ON "CallResult"("tenantId", "recordingAssetId");

-- AddConstraint
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_tenantId_id_key" UNIQUE ("tenantId", "id");
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_callAttemptId_key" UNIQUE ("callAttemptId");
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_tenantId_callAttemptId_key" UNIQUE ("tenantId", "callAttemptId");
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_tenantId_id_key" UNIQUE ("tenantId", "id");
ALTER TABLE "CallRecordingAsset" ADD CONSTRAINT "CallRecordingAsset_callAttemptId_key" UNIQUE ("callAttemptId");
ALTER TABLE "CallRecordingAsset" ADD CONSTRAINT "CallRecordingAsset_tenantId_callAttemptId_key" UNIQUE ("tenantId", "callAttemptId");
ALTER TABLE "CallRecordingAsset" ADD CONSTRAINT "CallRecordingAsset_tenantId_id_key" UNIQUE ("tenantId", "id");

-- AddForeignKey
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_tenantId_callAttemptId_fkey" FOREIGN KEY ("tenantId", "callAttemptId") REFERENCES "CallAttempt"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallTranscript" ADD CONSTRAINT "CallTranscript_tenantId_callAttemptId_fkey" FOREIGN KEY ("tenantId", "callAttemptId") REFERENCES "CallAttempt"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallTranscriptSegment" ADD CONSTRAINT "CallTranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "CallTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallRecordingAsset" ADD CONSTRAINT "CallRecordingAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallRecordingAsset" ADD CONSTRAINT "CallRecordingAsset_tenantId_callAttemptId_fkey" FOREIGN KEY ("tenantId", "callAttemptId") REFERENCES "CallAttempt"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallReconciliationIssue" ADD CONSTRAINT "CallReconciliationIssue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallReconciliationIssue" ADD CONSTRAINT "CallReconciliationIssue_tenantId_callAttemptId_fkey" FOREIGN KEY ("tenantId", "callAttemptId") REFERENCES "CallAttempt"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallResult" ADD CONSTRAINT "CallResult_tenantId_transcriptId_fkey" FOREIGN KEY ("tenantId", "transcriptId") REFERENCES "CallTranscript"("tenantId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "CallResult" ADD CONSTRAINT "CallResult_tenantId_recordingAssetId_fkey" FOREIGN KEY ("tenantId", "recordingAssetId") REFERENCES "CallRecordingAsset"("tenantId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
