-- CreateEnum
CREATE TYPE "UsageCredentialMode" AS ENUM ('platform', 'byok', 'fake');

-- AlterEnum
ALTER TYPE "UsageEventType" ADD VALUE 'asr_units';
ALTER TYPE "UsageEventType" ADD VALUE 'tts_units';
ALTER TYPE "UsageEventType" ADD VALUE 'llm_units';

-- AlterTable
ALTER TABLE "UsageEvent" ADD COLUMN "credentialMode" "UsageCredentialMode" NOT NULL DEFAULT 'fake';
