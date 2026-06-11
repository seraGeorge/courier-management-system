import { prisma } from "@/lib/prisma";

export const trackPackage = async (trackingId: string) => {
  return prisma.package.findUnique({
    where: {
      trackingId,
    },
    select: {
      trackingId: true,
      status: true,
      delayReason: true,
      region: {
        select: { code: true, name: true },
      },
      sale: {
        select: { amount: true, createdAt: true },
      },
    },
  });
};
