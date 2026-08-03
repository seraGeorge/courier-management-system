import { prisma } from "@/lib/prisma";

export const trackPackage = async (trackingId: string) => {
  const pkg = await prisma.package.findUnique({
    where: {
      trackingId,
    },
    select: {
      trackingId: true,
      status: true,
      delayReason: true,
      createdAt: true,
      region: {
        select: { code: true, name: true },
      },
      sale: {
        select: { amount: true, createdAt: true },
      },
    },
  });

  if (!pkg) return null;

  const history = await prisma.rawPackageUpdate.findMany({
    where: {
      trackingId,
      appliedAt: { not: null },
    },
    orderBy: { receivedAt: "asc" },
    select: {
      status: true,
      delayReason: true,
      receivedAt: true,
    },
  });

  return { ...pkg, history };
};
