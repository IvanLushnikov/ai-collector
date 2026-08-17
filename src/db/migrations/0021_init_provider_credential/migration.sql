-- CreateEnum
CREATE TYPE "SpeechCapability" AS ENUM ('asr', 'tts', 'llm');

-- CreateEnum
CREATE TYPE "SpeechProvider" AS ENUM ('yandex_speechkit', 'yandexgpt', 'gigachat');

-- CreateEnum
CREATE TYPE "CredentialMode" AS ENUM ('platform', 'byok');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('inactive', 'pending_probe', 'active', 'invalid', 'disabled');

-- CreateEnum
CREATE TYPE "ProbeResult" AS ENUM ('ok', 'failed');

-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "capability" "SpeechCapability" NOT NULL,
    "provider" "SpeechProvider" NOT NULL,
    "mode" "CredentialMode" NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'inactive',
    "displayName" TEXT NOT NULL,
    "secretHint" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "lastProbedAt" TIMESTAMP(3),
    "lastProbeResult" "ProbeResult",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialSecret" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerCredentialId" TEXT NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "nonce" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredentialSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCredential_tenantId_capability_key" ON "ProviderCredential"("tenantId", "capability");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialSecret_providerCredentialId_key" ON "CredentialSecret"("providerCredentialId");

-- AddForeignKey
ALTER TABLE "ProviderCredential" ADD CONSTRAINT "ProviderCredential_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialSecret" ADD CONSTRAINT "CredentialSecret_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialSecret" ADD CONSTRAINT "CredentialSecret_providerCredentialId_fkey" FOREIGN KEY ("providerCredentialId") REFERENCES "ProviderCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
