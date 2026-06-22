import { StatusMap } from "@/lib/package-status";
import { prisma } from "@/lib/prisma";
import { CreatePackageRequest } from "@shared/types";
import { PackageStatus, TruckStatus } from "@/generated/prisma/client";

const resolveStatus = (statusParam: number): PackageStatus => {
  const packageStatus = StatusMap[statusParam as keyof typeof StatusMap];
  if (!packageStatus) throw new Error("INVALID_STATUS");
  return packageStatus;
};

export const getPackages = async (
  statusParam?: number,
  regionCode?: string,
) => {
  const whereClause: { status?: PackageStatus; regionCode?: string } = {};

  if (statusParam !== undefined) {
    whereClause.status = resolveStatus(statusParam);
  }

  if (regionCode) {
    whereClause.regionCode = regionCode;
  }

  return prisma.package.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      trackingId: true,
      senderName: true,
      receiverName: true,
      fromAddress: true,
      toAddress: true,
      weight: true,
      status: true,
      createdAt: true,
      region: {
        select: { code: true, name: true },
      },
    },
  });
};

export const createPackage = async (data: CreatePackageRequest) => {
  const region = await prisma.region.findUnique({
    where: { code: data.regionCode },
  });
  const { regionCode, ...rest } = data;

  if (!region) throw new Error("INVALID_REGION");

  // Once a package is created it should be updated in the package status history.
  // This will help when connecting collection-app.
  const packageData = await prisma.package.create({
    data: {
      ...data,
      statusHistory: {
        create: {
          status: PackageStatus.TO_BE_PICKED_UP,
        },
      },
    },
  });

  return packageData;
};

export const getLoadedPackages = async () => {
  const truckBags = await prisma.truckBag.findMany({
    include: {
      truck: true,
      bag: {
        include: {
          packages: {
            include: {
              region: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return truckBags.flatMap((truckBag) =>
    truckBag.bag.packages.map((pkg) => ({
      ...pkg,
      truckNumber: truckBag.truck.truckNumber,
      truckStatus: truckBag.truck.status,
      bagNumber: truckBag.bag.bagNumber,
    })),
  );
};

export const getStatusUpdatedPackage = async (
  status: PackageStatus,
  trackingId: string,
) => {
  const packageData = await prisma.package.findUnique({
    where: {
      trackingId,
    },
  });

  if (!packageData) {
    throw new Error("PACKAGE_NOT_FOUND");
  }

  const updatedPackageData = await prisma.package.update({
    where: {
      trackingId,
    },
    data: {
      status,
      statusHistory: {
        create: {
          status,
        },
      },
    },
  });
  return updatedPackageData;
};
