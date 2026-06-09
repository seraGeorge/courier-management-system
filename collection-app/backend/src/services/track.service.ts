import { prisma } from "@/lib/prisma.js";

export const trackPackage = async (trackingId: string) => {
  return prisma.package.findUnique({
    where: {
      trackingId,
    },
  });
};
