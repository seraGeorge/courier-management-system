/*
  Warnings:

  - You are about to drop the column `processed` on the `RawPackageUpdate` table. All the data in the column will be lost.
  - Added the required column `batchId` to the `RawPackageUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RawPackageUpdate" DROP COLUMN "processed",
ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "batchId" TEXT NOT NULL,
ADD COLUMN     "confirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RawPackageUpdate_batchId_idx" ON "RawPackageUpdate"("batchId");
