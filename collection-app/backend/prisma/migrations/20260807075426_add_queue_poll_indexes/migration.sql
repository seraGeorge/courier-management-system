-- CreateIndex
CREATE INDEX "RawPackageUpdate_appliedAt_idx" ON "RawPackageUpdate"("appliedAt");

-- CreateIndex
CREATE INDEX "RawPackageUpdate_appliedAt_confirmedAt_idx" ON "RawPackageUpdate"("appliedAt", "confirmedAt");
