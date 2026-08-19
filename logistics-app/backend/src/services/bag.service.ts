import { BagStatus } from "@/generated/prisma/browser";
import { prisma } from "@/lib/prisma";
import { PackageStatus } from "@shared/enums";
import { AssignPackageToBagRequest } from "@shared/types/bag";
import {
  isValidLogisticsTransition,
  InvalidTransitionError,
} from "@/lib/package-state-machine";

export const createBag = async () => {
  return prisma.bag.create({
    data: {
      bagNumber: `BAG-${crypto.randomUUID().slice(0, 8)}`,
    },
  });
};

export const assignPackageToBag = async (data: AssignPackageToBagRequest) => {
  const { bagNumber, trackingId } = data;
  const bag = await prisma.bag.findUnique({
    where: {
      bagNumber,
    },
  });

  if (!bag) {
    throw new Error("BAG_NOT_FOUND");
  }

  const packageData = await prisma.package.findUnique({
    where: {
      trackingId,
    },
  });

  if (!packageData) {
    throw new Error("PACKAGE_NOT_FOUND");
  }

  // Validate state machine transition
  const validation = isValidLogisticsTransition(
    packageData.status,
    PackageStatus.ADDED_TO_BAG,
  );
  if (!validation.valid) {
    throw new InvalidTransitionError(
      packageData.status,
      PackageStatus.ADDED_TO_BAG,
      `Cannot assign package ${trackingId} to bag: ${validation.reason || "Invalid transition"}`,
    );
  }

  const updatedPackageData = await prisma.package.update({
    where: {
      trackingId,
    },
    data: {
      bagId: bag.id,
      status: PackageStatus.ADDED_TO_BAG,
      statusHistory: {
        create: {
          status: PackageStatus.ADDED_TO_BAG,
          customerId: packageData.customerId,
        },
      },
    },
  });
  return updatedPackageData;
};

export const getBags = async () => {
  return prisma.bag.findMany({
    where: {
      status: {
        not: BagStatus.COMPLETED,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      bagNumber: true,
      status: true,
      createdAt: true,
      packages: {
        select: {
          trackingId: true,
          senderName: true,
          receiverName: true,
          status: true,
        },
      },
      _count: {
        select: {
          packages: true,
        },
      },
    },
  });
};

export const getBagDetailsByNumber = async (bagNumber: string) => {
  return prisma.bag.findUnique({
    where: {
      bagNumber,
    },
    select: {
      bagNumber: true,
      status: true,
      createdAt: true,
      packages: {
        select: {
          trackingId: true,
          senderName: true,
          receiverName: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
};

export const sealBagByBagNumber = async (bagNumber: string) => {
  const bag = await prisma.bag.findUnique({
    where: {
      bagNumber,
    },
    include: {
      packages: true,
    },
  });

  if (!bag) {
    throw new Error("BAG_NOT_FOUND");
  }

  if (bag.packages.length === 0) {
    throw new Error("EMPTY_BAG");
  }

  return prisma.bag.update({
    where: {
      id: bag.id,
    },
    data: {
      status: BagStatus.SEALED,
    },
  });
};

export const delayBagByNumber = async (data: {
  bagNumber: string;
  delayReason: string;
}) => {
  const { bagNumber, delayReason } = data;
  const trimmedDelayReason = delayReason.trim();

  const bag = await prisma.bag.findUnique({
    where: {
      bagNumber,
    },
    include: {
      packages: {
        select: {
          id: true,
          customerId: true,
          status: true,
          trackingId: true,
        },
      },
    },
  });

  if (!bag) {
    throw new Error("BAG_NOT_FOUND");
  }
  if (bag.packages.length === 0) {
    throw new Error("EMPTY_BAG");
  }

  // Validate state machine transitions for all packages
  for (const pkg of bag.packages) {
    const validation = isValidLogisticsTransition(
      pkg.status,
      PackageStatus.DELAYED,
    );
    if (!validation.valid) {
      throw new InvalidTransitionError(
        pkg.status,
        PackageStatus.DELAYED,
        `Cannot delay package ${pkg.trackingId}: ${validation.reason || "Invalid transition"}`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedBag = await tx.bag.update({
      where: {
        id: bag.id,
      },
      data: {
        status: BagStatus.DELAYED,
        delayReason: trimmedDelayReason,
      },
    });

    await tx.package.updateMany({
      where: {
        bagId: bag.id,
      },
      data: {
        status: PackageStatus.DELAYED,
        delayReason: trimmedDelayReason,
      },
    });

    await tx.packageStatusHistory.createMany({
      data: bag.packages.map((pkg) => ({
        packageId: pkg.id,
        status: PackageStatus.DELAYED,
        remarks: trimmedDelayReason,
        customerId: pkg.customerId,
      })),
    });

    return updatedBag;
  });
};

export const completeBagByNumber = async (bagNumber: string) => {
  const bag = await prisma.bag.findUnique({
    where: {
      bagNumber,
    },
    include: {
      packages: true,
    },
  });

  if (!bag) {
    throw new Error("BAG_NOT_FOUND");
  }

  return prisma.bag.update({
    where: {
      id: bag.id,
    },
    data: {
      status: BagStatus.COMPLETED,
    },
  });
};
