import { Customer, PackageStatus } from "@/generated/prisma/browser";
import { LogisticsToCollectionAppStatusMap } from "@/lib/package-status";
import { prisma } from "@/lib/prisma";
import { generateSignature } from "@/utils/hmac";
import axios from "axios";

export const getPendingUpdates = async (customerId: string) => {
  const histories = await prisma.packageStatusHistory.findMany({
    where: {
      processed: false,
      customerId: customerId,
    },
    select: {
      id: true,
      package: {
        select: {
          trackingId: true,
        },
      },
      status: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const latest = new Map();
  console.log("Histories:", histories);
  for (const history of histories) {
    if (!latest.has(history.package.trackingId)) {
      latest.set(history.package.trackingId, {
        eventId: history.id,
        trackingId: history.package.trackingId,
        status: LogisticsToCollectionAppStatusMap[history.status],
      });
    }
  }

  return [...latest.values()];
};
export type PendingPackageUpdate = Awaited<
  ReturnType<typeof getPendingUpdates>
>[number];
export const sendPackageUpdatesToCollection = async (
  customer: Customer,
  updates: PendingPackageUpdate[],
) => {
  await axios.post(customer.webhookUrl!, updates, {
    headers: {
      "x-api-key": customer.apiKey,
      "x-signature": generateSignature(
        JSON.stringify(updates),
        customer.secretKey,
      ),
    },
  });
};

export const markUpdatesProcessed = async (eventIds: string[]) => {
  await prisma.packageStatusHistory.updateMany({
    where: {
      id: {
        in: eventIds,
      },
    },
    data: {
      processed: true,
    },
  });
};
