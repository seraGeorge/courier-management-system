-- CreateTable
CREATE TABLE "EtlCheckpoint" (
    "id" TEXT NOT NULL,
    "lastProcessedId" INTEGER,

    CONSTRAINT "EtlCheckpoint_pkey" PRIMARY KEY ("id")
);
