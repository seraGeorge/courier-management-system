import { prisma } from "@/lib/prisma";

export const confirmPackageUpdateBatch = async (
  batchId: string,
  confirmations: {
    eventId: string;
    trackingId: string;
    status: string;
  }[],
) => {
  const eventIds = confirmations.map((c) => c.eventId);

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

  console.log(`[ETL] Confirmed batch ${batchId} (${eventIds.length} events)`);
};
