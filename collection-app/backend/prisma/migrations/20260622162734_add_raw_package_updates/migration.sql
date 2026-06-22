-- CreateTable
CREATE TABLE "RawPackageUpdate" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RawPackageUpdate_pkey" PRIMARY KEY ("id")
);
