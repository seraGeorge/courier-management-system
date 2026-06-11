import { PackageStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getPackages } from "./package.service";

export const getDashboardData = async () => {
  const [pendingPackages, activePackages, delayedPackages] = await Promise.all([
    getPackages(0),
    getPackages(1),
    getPackages(2),
  ]);

  return {
    pendingPackages: {
      count: pendingPackages.length,
      packages: pendingPackages,
    },
    activePackages: { count: activePackages.length, packages: activePackages },
    delayedPackages: {
      count: delayedPackages.length,
      packages: delayedPackages,
    },
  };
};
