import { prisma } from "@/lib/prisma";
import { PackageStatus, Prisma } from "@/generated/prisma/client";
import { StatusMap } from "@/lib/constants/package-status";
import { generateSignature } from "@/utils/hmac";
import axios from "axios";

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") throw new Error("NOT_FOUND");
  }
  throw error;
};

const resolveStatus = (statusParam: number): PackageStatus => {
  const packageStatus = StatusMap[statusParam as keyof typeof StatusMap];
  if (!packageStatus) throw new Error("INVALID_STATUS");
  return packageStatus;
};

export const getPackages = async (
  statusParam?: number,
  regionCode?: string,
) => {
  const whereClause: { status?: PackageStatus; regionCode?: string } = {};

  if (statusParam !== undefined) {
    whereClause.status = resolveStatus(statusParam);
  }

  if (regionCode) {
    whereClause.regionCode = regionCode;
  }

  return prisma.package.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      trackingId: true,
      senderName: true,
      receiverName: true,
      fromAddress: true,
      toAddress: true,
      weight: true,
      status: true,
      delayReason: true,
      createdAt: true,
      region: {
        select: { code: true, name: true },
      },
    },
  });
};

const calculateAmount = (weight: number) => weight * 50;
export const createPackage = async (data: {
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  regionCode: string;
  trackingId: string;
}) => {
  const region = await prisma.region.findUnique({
    where: { code: data.regionCode },
  });

  if (!region) throw new Error("INVALID_REGION");

  return prisma.package
    .create({
      data: {
        ...data,
        sale: { create: { amount: calculateAmount(data.weight) } },
      },
      include: {
        sale: true,
        region: { select: { code: true, name: true } },
      },
    })
    .catch(handlePrismaError);
};

export const updatePackageStatus = async (
  identifier: string,
  status: number,
  delayReason?: string,
) => {
  const packageStatus = resolveStatus(status);

  if (packageStatus === PackageStatus.DELAYED && !delayReason) {
    throw new Error("DELAY_REASON_REQUIRED");
  }

  const packageData = await prisma.package.findFirst({
    where: {
      OR: [{ id: identifier }, { trackingId: identifier }],
    },
  });

  if (!packageData) {
    throw new Error("PACKAGE_NOT_FOUND");
  }

  return prisma.package
    .update({
      where: {
        id: packageData.id,
      },
      data: {
        status: packageStatus,
        delayReason:
          packageStatus === PackageStatus.DELAYED ? delayReason : null,
      },
    })
    .catch(handlePrismaError);
};

export const createRawPackageUpdates = async (data: {
  batchId: string;
  updates: { eventId: string; trackingId: string; status: PackageStatus }[];
}) => {
  const { batchId, updates } = data;

  // createMany skips rows violating unique constraints (eventId) rather than
  // throwing — this makes redelivery of an already-staged batch a no-op.
  const result = await prisma.rawPackageUpdate.createMany({
    data: updates.map((u) => ({
      batchId,
      eventId: u.eventId,
      trackingId: u.trackingId,
      status: u.status,
    })),
    skipDuplicates: true,
  });

  return { batchId, staged: result.count, received: updates.length };
};
export const processRawUpdates = async () => {
  // 1. Apply anything not yet applied
  const unapplied = await prisma.rawPackageUpdate.findMany({
    where: { appliedAt: null },
    orderBy: { receivedAt: "asc" },
    take: 200,
  });

  if (unapplied.length > 0) {
    console.log(`[ETL] Applying ${unapplied.length} update(s)`);
  }

  for (const update of unapplied) {
    try {
      const existing = await prisma.package.findUnique({
        where: { trackingId: update.trackingId },
      });

      if (!existing) {
        console.error(
          `[ETL] Package not found for trackingId ${update.trackingId} (eventId ${update.eventId}) — skipping row, not the batch.`,
        );
        continue; // left appliedAt: null — retried next tick; revisit if this needs a cutoff
      }

      await prisma.$transaction([
        prisma.package.update({
          where: { trackingId: update.trackingId }, // unique — no need for updateMany
          data: { status: update.status },
        }),
        prisma.rawPackageUpdate.update({
          where: { id: update.id },
          data: { appliedAt: new Date() },
        }),
      ]);
    } catch (err) {
      console.error(`[ETL] Failed to apply update ${update.id}`, err);
      // appliedAt stays null — retried next tick
    }
  }

  // 2. Confirm anything applied but not yet confirmed, grouped by batch
  const unconfirmed = await prisma.rawPackageUpdate.findMany({
    where: { appliedAt: { not: null }, confirmedAt: null },
    orderBy: { receivedAt: "asc" },
  });

  const byBatch = new Map<string, typeof unconfirmed>();
  for (const u of unconfirmed) {
    if (!byBatch.has(u.batchId)) byBatch.set(u.batchId, []);
    byBatch.get(u.batchId)!.push(u);
  }

  for (const [batchId, rows] of byBatch) {
    try {
      const payload = JSON.stringify({
        batchId,
        confirmations: rows.map((r) => ({
          eventId: r.eventId,
          trackingId: r.trackingId,
          status: r.status,
        })),
      });

      await axios.post(
        `${process.env.LOGISTICS_BASE_URL}/api/etl/confirm`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.COLLECTION_API_KEY!,
            "x-signature": generateSignature(
              payload,
              process.env.COLLECTION_SECRET_KEY!,
            ),
          },
        },
      );

      await prisma.rawPackageUpdate.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { confirmedAt: new Date() },
      });
    } catch (err) {
      console.error(`[ETL] Failed to confirm batch ${batchId}`, err);
      // confirmedAt stays null — retried next tick, no reapplication
    }
  }
};
