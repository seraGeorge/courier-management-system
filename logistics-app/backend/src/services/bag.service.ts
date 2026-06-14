import { BagStatus } from "@/generated/prisma/browser";
import { prisma } from "@/lib/prisma";
import { PackageStatus } from "@shared/enums";
import { AssignPackageToBagRequest } from "@shared/types/bag";

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
        },
      },
    },
  });
  return updatedPackageData;
};

export const getBags = async () => {
  return prisma.bag.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      bagNumber: true,
      status: true,
      createdAt: true,
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
      status: BagStatus.DELAYED,
      delayReason: delayReason,
    },
  });
};
