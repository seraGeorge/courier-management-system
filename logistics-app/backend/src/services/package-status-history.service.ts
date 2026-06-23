import { LogisticsToCollectionAppStatusMap } from "@/lib/package-status";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export const getUpdatedPackages = async () => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const histories = await prisma.packageStatusHistory.findMany({
    where: {
      createdAt: {
        gte: oneMinuteAgo,
      },
    },
    select: {
      package: {
        select: {
          trackingId: true,
        },
      },
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const latest = new Map();
console.log("Histories:", histories);
  for (const history of histories) {
    if (!latest.has(history.package.trackingId)) {
      latest.set(history.package.trackingId, {
        trackingId: history.package.trackingId,
        status: LogisticsToCollectionAppStatusMap[history.status],
      });
    }
  }

  return [...latest.values()];
};

export const pushUpdatesToCollection = async () => {
  const updates = await getUpdatedPackages();

  console.log("Updates found:", updates);

  if (updates.length === 0) {
    return;
  }

  await axios.post(process.env.COLLECTION_RAW_UPDATE_URL!, updates);

  console.log(`Pushed ${updates.length} updates`);
};