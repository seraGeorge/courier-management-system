import {
  BagStatus,
  PackageStatus,
  TruckStatus,
} from "@/generated/prisma/browser";
import { prisma } from "@/lib/prisma";
import { LoadBagToTruckRequest } from "@shared/types";

export const createTruck = async () => {
  return prisma.truck.create({
    data: {
      truckNumber: `TRUCK-${crypto.randomUUID().slice(0, 8)}`,
    },
  });
};

export const getTrucks = async () => {
  return prisma.truck.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      truckNumber: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          truckBags: true,
        },
      },
    },
  });
};

export const loadBagToTruck = async (data: LoadBagToTruckRequest) => {
  const { truckNumber, bagNumber } = data;

  const truck = await prisma.truck.findUnique({
    where: {
      truckNumber: truckNumber,
    },
  });

  if (!truck) {
    throw new Error("TRUCK_NOT_FOUND");
  }

  const bag = await prisma.bag.findUnique({
    where: {
      bagNumber: bagNumber,
    },
  });

  if (!bag) {
    throw new Error("BAG_NOT_FOUND");
  }

  if (bag.status !== BagStatus.SEALED) {
    throw new Error("BAG_NOT_SEALED");
  }

  return prisma.$transaction(async (tx) => {
    const truckBag = await tx.truckBag.create({
      data: {
        truckId: truck.id,
        bagId: bag.id,
      },
    });

    await tx.bag.update({
      where: {
        id: bag.id,
      },
      data: {
        status: BagStatus.IN_TRANSIT,
      },
    });
    await tx.truck.update({
      where: {
        id: truck.id,
      },
      data: {
        status: TruckStatus.LOADED,
      },
    });

    return truckBag;
  });
};

export const getTruckDetailsByTruckNumber = async (truckNumber: string) => {
  return prisma.truck.findUnique({
    where: {
      truckNumber,
    },
    select: {
      truckNumber: true,
      status: true,
      createdAt: true,
      truckBags: {
        select: {
          bag: {
            select: {
              bagNumber: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
};

export const getArrivedTruckDetailsByTruckNumber = async (
  truckNumber: string,
) => {
  const truck = await prisma.truck.findUnique({
    where: {
      truckNumber,
    },
    include: {
      truckBags: { include: { bag: { include: { packages: true } } } },
    },
  });

  if (!truck) {
    throw new Error("TRUCK_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    // Update Truck status to ARRIVED
    await tx.truck.update({
      where: {
        id: truck.id,
      },
      data: {
        status: TruckStatus.ARRIVED,
      },
    });

    for (const truckBag of truck.truckBags) {
      // Update Bag status to OPEN
      await tx.bag.update({
        where: {
          id: truckBag.bag.id,
        },
        data: {
          status: BagStatus.ARRIVED,
        },
      });

      // Update each package status to ARRIVED_AT_REGION and update package status history
      for (const pkg of truckBag.bag.packages) {
        await tx.package.update({
          where: {
            id: pkg.id,
          },
          data: {
            status: PackageStatus.ARRIVED_AT_REGION,
          },
        });

        await tx.packageStatusHistory.create({
          data: {
            packageId: pkg.id,
            status: PackageStatus.ARRIVED_AT_REGION,
          },
        });
      }
    }

    return {
      truckNumber: truck.truckNumber,
      status: TruckStatus.ARRIVED,
    };
  });
};

export const getLatestArrivalPackages = async () => {
  const latestTruck = await prisma.truck.findFirst({
    where: {
      status: TruckStatus.ARRIVED,
      arrivedAt: {
        not: null,
      },
    },
    orderBy: {
      arrivedAt: "desc",
    },
    include: {
      truckBags: {
        include: {
          bag: {
            include: {
              packages: true,
            },
          },
        },
      },
    },
  });

  if (!latestTruck) {
    return [];
  }

  return latestTruck.truckBags.flatMap((truckBag) => truckBag.bag.packages);
};