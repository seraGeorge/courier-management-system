/*
  Warnings:

  - A unique constraint covering the columns `[bagId]` on the table `TruckBag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TruckBag_bagId_key" ON "TruckBag"("bagId");
