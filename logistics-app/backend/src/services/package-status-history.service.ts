import { Customer } from "@/generated/prisma/client";
import {
  CollectionPackageStatus,
  LogisticsToCollectionAppStatusMap,
} from "@/lib/package-status";
import { prisma } from "@/lib/prisma";
import { generateSignature } from "@/utils/hmac";
import axios from "axios";
import { randomUUID } from "crypto";

export const getPendingUpdates = async (customerId: string) => {
  const histories = await prisma.packageStatusHistory.findMany({
    where: { processed: false, customerId },
    select: {
      id: true,
      package: { select: { trackingId: true } },
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const latestByTracking = new Map<
    string,
    { eventId: string; trackingId: string; status: CollectionPackageStatus }
  >();
  const supersededEventIds: string[] = [];

  for (const history of histories) {
    const existing = latestByTracking.get(history.package.trackingId);
    if (existing) supersededEventIds.push(existing.eventId); // older event for same package, now stale
    latestByTracking.set(history.package.trackingId, {
      eventId: history.id,
      trackingId: history.package.trackingId,
      status: LogisticsToCollectionAppStatusMap[history.status],
    });
  }

  return {
    updates: [...latestByTracking.values()],
    supersededEventIds, // caller should mark these processed too, alongside the sent ones
  };
};

export interface PendingPackageUpdate {
  eventId: string;
  trackingId: string;
  status: CollectionPackageStatus; // not PackageStatus
}

export const sendPackageUpdatesToCollection = async (
  customer: Customer,
  batchId: string,
  updates: PendingPackageUpdate[],
) => {
  if (!customer.webhookUrl || !customer.apiKey || !customer.secretKey) {
    throw new Error(
      `Customer ${customer.id} is missing webhookUrl, apiKey, or secretKey`,
    );
  }

  const payload = JSON.stringify({ batchId, updates }); // wrapped, per the last review

  await axios.post(customer.webhookUrl, payload, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": customer.apiKey,
      "x-signature": generateSignature(payload, customer.secretKey),
    },
  });
};

export const markUpdatesProcessed = async (eventIds: string[]) => {
  if (eventIds.length === 0) return { requested: 0, updated: 0 };

  const result = await prisma.packageStatusHistory.updateMany({
    where: { id: { in: eventIds } },
    data: { processed: true },
  });

  if (result.count !== eventIds.length) {
    console.warn(
      `[ETL Confirm] Expected to mark ${eventIds.length} rows processed, only matched ${result.count}. ` +
        `Missing eventIds may indicate deleted history rows or a data-sync issue.`,
    );
  }

  return { requested: eventIds.length, updated: result.count };
};

// orchestration — this is the piece that's currently missing
export const runEtlPushForCustomer = async (customer: Customer) => {
  const { updates, supersededEventIds } = await getPendingUpdates(customer.id);

  if (supersededEventIds.length) {
    await markUpdatesProcessed(supersededEventIds);
  }

  if (!updates.length) return;

  const batchId = randomUUID();
  await sendPackageUpdatesToCollection(customer, batchId, updates);
};
