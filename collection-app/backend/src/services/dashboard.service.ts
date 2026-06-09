import { PackageStatus } from "@/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export const getDashboardData = async () => {
  const [pendingPackages, transitedPackages, delayedPackages] =
    await Promise.all([
      prisma.package.findMany({
        where: {
          status: PackageStatus.TO_BE_PICKED_UP,
        },
      }),
      prisma.package.findMany({
        where: {
          status: PackageStatus.IN_TRANSIT,
        },
      }),
      prisma.package.findMany({
        where: {
          status: PackageStatus.DELAYED,
        },
      }),
    ]);

  return {
    pendingPackages: {
      count: pendingPackages.length,
      packages: pendingPackages,
    },
    transitedPackages: {
      count: transitedPackages.length,
      packages: transitedPackages,
    },
    delayedPackages: {
      count: delayedPackages.length,
      packages: delayedPackages,
    },
  };
};
