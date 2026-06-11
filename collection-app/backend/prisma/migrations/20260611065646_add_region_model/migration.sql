/*
  Warnings:

  - You are about to drop the column `regionId` on the `Package` table. All the data in the column will be lost.
  - Added the required column `regionCode` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_regionId_fkey";

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "regionId",
ADD COLUMN     "regionCode" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
