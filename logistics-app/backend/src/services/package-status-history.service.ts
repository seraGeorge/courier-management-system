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
  const unprocessed = await prisma.packageStatusHistory.findMany({
    where: { processed: false, customerId },
    select: {
      id: true,
      remarks: true,
      createdAt: true,
      package: { select: { trackingId: true, delayReason: true } },
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    updates: unprocessed.map((history) => {
      const mappedStatus = LogisticsToCollectionAppStatusMap[history.status];
      return {
        eventId: history.id,
        trackingId: history.package.trackingId,
        status: mappedStatus,
        occurredAt: history.createdAt.toISOString(),
        delayReason:
          mappedStatus === "DELAYED"
            ? history.remarks ?? history.package.delayReason
            : null,
      };
    }),
  };
};

export interface PendingPackageUpdate {
  eventId: string;
  trackingId: string;
  status: CollectionPackageStatus; // not PackageStatus
  occurredAt: string;
  delayReason?: string | null;
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
  const { updates } = await getPendingUpdates(customer.id);
  console.log("[ETL] Pending updates:", updates.length);
  console.log(updates);

  if (!updates.length) return;

  const batchId = randomUUID();
  await sendPackageUpdatesToCollection(customer, batchId, updates);
};
