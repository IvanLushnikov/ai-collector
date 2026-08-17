-- AlterTable
ALTER TABLE "TelephonyConnection" ADD COLUMN "handoffNumber" TEXT;
ALTER TABLE "TelephonyConnection" ADD COLUMN "handoffWindowStart" TEXT;
ALTER TABLE "TelephonyConnection" ADD COLUMN "handoffWindowEnd" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "dailyCallCap" INTEGER;

-- AlterTable
ALTER TABLE "CallAttempt" ADD COLUMN "identityVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CallAttempt" ADD COLUMN "identityVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WebhookInboxEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookInboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookInboxEvent_tenantId_sourceSystem_eventId_key" ON "WebhookInboxEvent"("tenantId", "sourceSystem", "eventId");

-- AddForeignKey
ALTER TABLE "WebhookInboxEvent" ADD CONSTRAINT "WebhookInboxEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
