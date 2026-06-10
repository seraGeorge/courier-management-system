import { PackageStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const getDashboardData = async () => {
  const [pendingPackages, activePackages, delayedPackages] = await Promise.all([
    prisma.package.findMany({
      where: {
        status: PackageStatus.TO_BE_PICKED_UP,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.package.findMany({
      where: {
        status: { in: [PackageStatus.IN_TRANSIT, PackageStatus.PICKED_UP] },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.package.findMany({
      where: {
        status: PackageStatus.DELAYED,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    pendingPackages: {
      count: pendingPackages.length,
      packages: pendingPackages,
    },
    activePackages: {
      count: activePackages.length,
      packages: activePackages,
    },
    delayedPackages: {
      count: delayedPackages.length,
      packages: delayedPackages,
    },
  };
};
