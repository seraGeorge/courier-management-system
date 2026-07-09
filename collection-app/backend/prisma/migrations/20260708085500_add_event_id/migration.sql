/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `RawPackageUpdate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `RawPackageUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RawPackageUpdate" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RawPackageUpdate_eventId_key" ON "RawPackageUpdate"("eventId");
