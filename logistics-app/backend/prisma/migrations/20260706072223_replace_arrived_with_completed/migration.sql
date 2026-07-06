/*
  Warnings:

  - The values [ARRIVED] on the enum `BagStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BagStatus_new" AS ENUM ('OPEN', 'SEALED', 'LOADED', 'IN_TRANSIT', 'DELAYED', 'COMPLETED');
ALTER TABLE "public"."Bag" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bag" ALTER COLUMN "status" TYPE "BagStatus_new" USING ("status"::text::"BagStatus_new");
ALTER TYPE "BagStatus" RENAME TO "BagStatus_old";
ALTER TYPE "BagStatus_new" RENAME TO "BagStatus";
DROP TYPE "public"."BagStatus_old";
ALTER TABLE "Bag" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;
