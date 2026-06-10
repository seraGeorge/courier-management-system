import { prisma } from "@/lib/prisma";

export const trackPackage = async (trackingId: string) => {
  return prisma.package.findUnique({
    where: {
      trackingId,
    },
  });
};
