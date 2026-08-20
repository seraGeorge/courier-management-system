-- AlterTable
ALTER TABLE "PackageStatusHistory" ADD COLUMN "sourceEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PackageStatusHistory_packageId_sourceEventId_key" ON "PackageStatusHistory"("packageId", "sourceEventId");
