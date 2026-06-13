import { BagStatus, TruckStatus } from "@/generated/prisma/browser";
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
