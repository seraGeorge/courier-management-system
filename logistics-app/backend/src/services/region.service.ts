import { prisma } from "@/lib/prisma";

export const getRegionsList = async () => {
  return prisma.region.findMany({
    orderBy: { name: "asc" },
  });
};
