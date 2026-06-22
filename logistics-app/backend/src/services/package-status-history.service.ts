import { prisma } from "@/lib/prisma";

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
      createdAt: "asc",
    },
  });

  const latest = new Map();

  for (const history of histories) {
    if (!latest.has(history.package.trackingId)) {
      latest.set(history.package.trackingId, {
        trackingId: history.package.trackingId,
        status: history.status,
      });
    }
  }

  return [...latest.values()];
};
