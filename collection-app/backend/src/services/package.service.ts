import { prisma } from "@/lib/prisma";
import { PackageStatus, Prisma, SyncStatus } from "@/generated/prisma/client";
import {
  COLLECTION_OWNED_STATUSES,
  StatusMap,
} from "@/lib/constants/package-status";
import {
  PACKAGE_CREATED_EVENT,
  PACKAGE_STATUS_UPDATED_EVENT,
} from "@/services/notifyLogistics.service";
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
      syncStatus: true,
      syncedAt: true,
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

  const webhookPayload = {
    senderName: data.senderName,
    receiverName: data.receiverName,
    fromAddress: data.fromAddress,
    toAddress: data.toAddress,
    weight: data.weight,
    regionCode: data.regionCode,
    trackingId: data.trackingId,
  };

  return prisma.$transaction(async (tx) => {
    const newPackage = await tx.package.create({
      data: {
        ...data,
        syncStatus: SyncStatus.PENDING,
        sale: { create: { amount: calculateAmount(data.weight) } },
      },
      include: {
        sale: true,
        region: { select: { code: true, name: true } },
      },
    });

    await tx.outboundWebhook.create({
      data: {
        eventType: PACKAGE_CREATED_EVENT,
        payload: webhookPayload,
        trackingId: data.trackingId,
      },
    });

    return newPackage;
  }).catch(handlePrismaError);
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

  const shouldNotifyLogistics = COLLECTION_OWNED_STATUSES.has(packageStatus);

  return prisma
    .$transaction(async (tx) => {
      const updatedPackage = await tx.package.update({
        where: {
          id: packageData.id,
        },
        data: {
          status: packageStatus,
          delayReason:
            packageStatus === PackageStatus.DELAYED ? delayReason : null,
        },
      });

      // Last-mile / collection-owned statuses must sync back to Logistics.
      if (shouldNotifyLogistics) {
        await tx.outboundWebhook.create({
          data: {
            eventType: PACKAGE_STATUS_UPDATED_EVENT,
            trackingId: packageData.trackingId,
            payload: {
              trackingId: packageData.trackingId,
              status: packageStatus,
              delayReason:
                packageStatus === PackageStatus.DELAYED
                  ? delayReason ?? null
                  : null,
            },
          },
        });
      }

      return updatedPackage;
    })
    .catch(handlePrismaError);
};

export const createRawPackageUpdates = async (data: {
  batchId: string;
  updates: {
    eventId: string;
    trackingId: string;
    status: PackageStatus;
    occurredAt?: string;
    delayReason?: string | null;
  }[];
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
      delayReason: u.status === PackageStatus.DELAYED ? u.delayReason ?? null : null,
      receivedAt: u.occurredAt ? new Date(u.occurredAt) : undefined,
    })),
    skipDuplicates: true,
  });

  return { batchId, staged: result.count, received: updates.length };
};
export const processRawUpdates = async () => {
  // 1. Apply anything not yet applied
  const unapplied = await prisma.rawPackageUpdate.findMany({
    where: { appliedAt: null },
    orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
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
        // Collection is the package source of truth (Logistics only receives creates).
        // A status update for an unknown trackingId will not self-heal — mark it applied
        // so we stop clogging the queue and can confirm back to Logistics.
        console.warn(
          `[ETL] Package not found for trackingId ${update.trackingId} (eventId ${update.eventId}) — marking applied and skipping.`,
        );
        await prisma.rawPackageUpdate.update({
          where: { id: update.id },
          data: { appliedAt: new Date() },
        });
        continue;
      }

      await prisma.$transaction([
        prisma.package.update({
          where: { trackingId: update.trackingId }, // unique — no need for updateMany
          data: {
            status: update.status,
            delayReason:
              update.status === PackageStatus.DELAYED
                ? update.delayReason
                : null,
          },
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

      await axios.post(`${process.env.API_URL}/etl/confirm`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.LOGISTICS_API_KEY!,
          "x-signature": generateSignature(
            payload,
            process.env.LOGISTICS_SECRET_KEY!,
          ),
        },
      });

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
