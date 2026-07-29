-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "syncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OutboundWebhook" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "trackingId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "OutboundWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundWebhook_deliveredAt_nextRetryAt_idx" ON "OutboundWebhook"("deliveredAt", "nextRetryAt");
