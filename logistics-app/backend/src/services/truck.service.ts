import {
  BagStatus,
  PackageStatus,
  TruckStatus,
} from "@/generated/prisma/browser";
import { prisma } from "@/lib/prisma";
import { LoadBagToTruckRequest, TruckResponse } from "@shared/types";
import {
  isValidLogisticsTransition,
  InvalidTransitionError,
} from "@/lib/package-state-machine";

export const createTruck = async () => {
  return prisma.truck.create({
    data: {
      truckNumber: `TRUCK-${crypto.randomUUID().slice(0, 8)}`,
    },
  });
};

export const getTrucks = async (status?: TruckStatus | TruckStatus[]) => {
  return prisma.truck.findMany({
    where: status
      ? {
          status: Array.isArray(status) ? { in: status } : status,
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
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
              packages: {
                select: {
                  trackingId: true,
                },
              },
            },
          },
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

  const packages = await prisma.package.findMany({
    where: {
      bagId: bag.id,
    },
  });

  // Validate state machine transitions for all packages
  for (const pkg of packages) {
    const validation = isValidLogisticsTransition(
      pkg.status,
      PackageStatus.LOADED_ON_TRUCK
    );
    if (!validation.valid) {
      throw new InvalidTransitionError(
        pkg.status,
        PackageStatus.LOADED_ON_TRUCK,
        `Cannot load package ${pkg.trackingId}: ${validation.reason || "Invalid transition"}`
      );
    }
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
        status: BagStatus.LOADED,
      },
    });
    await tx.package.updateMany({
      where: {
        bagId: bag.id,
      },
      data: {
        status: PackageStatus.LOADED_ON_TRUCK,
      },
    });
    await tx.packageStatusHistory.createMany({
      data: packages.map((pkg) => ({
        packageId: pkg.id,
        status: PackageStatus.LOADED_ON_TRUCK,
        customerId: pkg.customerId,
      })),
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

  // Validate state machine transitions for all packages before making updates
  for (const truckBag of truck.truckBags) {
    for (const pkg of truckBag.bag.packages) {
      const validation = isValidLogisticsTransition(
        pkg.status,
        PackageStatus.ARRIVED_AT_REGION
      );
      if (!validation.valid) {
        throw new InvalidTransitionError(
          pkg.status,
          PackageStatus.ARRIVED_AT_REGION,
          `Cannot mark package ${pkg.trackingId} as arrived: ${validation.reason || "Invalid transition"}`
        );
      }
    }
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
      // Update Bag status to COMPLETED
      await tx.bag.update({
        where: {
          id: truckBag.bag.id,
        },
        data: {
          status: BagStatus.COMPLETED,
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
            customerId: pkg.customerId,
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

export const updateTruckStatus = async (
  truckNumber: string,
  status: TruckStatus,
  delayReason?: string,
) => {
  if (status === TruckStatus.DELAYED && !delayReason?.trim()) {
    throw new Error("DELAY_REASON_REQUIRED");
  }

  const trimmedDelayReason = delayReason?.trim();

  return prisma.$transaction(async (tx) => {
    const truck = await tx.truck.findUnique({
      where: {
        truckNumber,
      },
      include: {
        truckBags: {
          select: {
            bagId: true,
          },
        },
      },
    });

    if (!truck) {
      throw new Error("TRUCK_NOT_FOUND");
    }

    const bagIds = truck.truckBags.map((tb) => tb.bagId);

    const packages = await tx.package.findMany({
      where: {
        bagId: {
          in: bagIds,
        },
      },
      select: {
        id: true,
        customerId: true,
        status: true,
        trackingId: true,
      },
    });

    // Validate state machine transitions based on the target truck status
    let targetPackageStatus: PackageStatus | null = null;
    if (status === TruckStatus.ARRIVED) {
      targetPackageStatus = PackageStatus.ARRIVED_AT_REGION;
    } else if (status === TruckStatus.DELAYED) {
      targetPackageStatus = PackageStatus.DELAYED;
    } else if (status === TruckStatus.DEPARTED) {
      targetPackageStatus = PackageStatus.EN_ROUTE;
    }

    if (targetPackageStatus) {
      for (const pkg of packages) {
        const validation = isValidLogisticsTransition(pkg.status, targetPackageStatus);
        if (!validation.valid) {
          throw new InvalidTransitionError(
            pkg.status,
            targetPackageStatus,
            `Cannot update package ${pkg.trackingId}: ${validation.reason || "Invalid transition"}`
          );
        }
      }
    }

    await tx.truck.update({
      where: {
        truckNumber,
      },
      data: {
        status,
      },
    });

    if (bagIds.length > 0) {
      if (status === TruckStatus.ARRIVED) {
        await tx.bag.updateMany({
          where: {
            id: {
              in: bagIds,
            },
          },
          data: {
            status: BagStatus.COMPLETED,
            delayReason: null,
          },
        });

        await tx.package.updateMany({
          where: {
            bagId: {
              in: bagIds,
            },
          },
          data: {
            status: PackageStatus.ARRIVED_AT_REGION,
            delayReason: null,
          },
        });

        await tx.packageStatusHistory.createMany({
          data: packages.map((pkg) => ({
            packageId: pkg.id,
            status: PackageStatus.ARRIVED_AT_REGION,
            customerId: pkg.customerId,
          })),
        });
      }

      if (status === TruckStatus.DELAYED) {
        await tx.bag.updateMany({
          where: {
            id: {
              in: bagIds,
            },
          },
          data: {
            status: BagStatus.DELAYED,
            delayReason: trimmedDelayReason,
          },
        });

        await tx.package.updateMany({
          where: {
            bagId: {
              in: bagIds,
            },
          },
          data: {
            status: PackageStatus.DELAYED,
            delayReason: trimmedDelayReason,
          },
        });

        await tx.packageStatusHistory.createMany({
          data: packages.map((pkg) => ({
            packageId: pkg.id,
            status: PackageStatus.DELAYED,
            remarks: trimmedDelayReason,
            customerId: pkg.customerId,
          })),
        });
      }

      if (status === TruckStatus.DEPARTED) {
        await tx.bag.updateMany({
          where: {
            id: {
              in: bagIds,
            },
          },
          data: {
            status: BagStatus.IN_TRANSIT,
            delayReason: null,
          },
        });

        await tx.package.updateMany({
          where: {
            bagId: {
              in: bagIds,
            },
          },
          data: {
            status: PackageStatus.EN_ROUTE,
            delayReason: null,
          },
        });

        await tx.packageStatusHistory.createMany({
          data: packages.map((pkg) => ({
            packageId: pkg.id,
            status: PackageStatus.EN_ROUTE,
            customerId: pkg.customerId,
          })),
        });
      }
    }

    return tx.truck.findUnique({
      where: {
        truckNumber,
      },
      include: {
        truckBags: true,
      },
    });
  });
};
