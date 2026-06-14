/*
  Warnings:

  - You are about to drop the column `delayReason` on the `Package` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bag" ADD COLUMN     "delayReason" TEXT;

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "delayReason";
