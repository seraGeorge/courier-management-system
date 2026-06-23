import { prisma } from "@/lib/prisma";
import { PackageStatus, Prisma } from "@/generated/prisma/client";
import { StatusMap } from "@/lib/constants/package-status";
import { RawPackageUpdateInput } from "@/validations/package";

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") throw new Error("NOT_FOUND");
  }
  throw error;
};

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
      delayReason: true,
      createdAt: true,
      region: {
        select: { code: true, name: true },
      },
    },
  });
};

const calculateAmount = (weight: number) => weight * 50;
export const createPackage = async (data: {
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  regionCode: string;
  trackingId: string;
}) => {
  const region = await prisma.region.findUnique({
    where: { code: data.regionCode },
  });

  if (!region) throw new Error("INVALID_REGION");

  const { regionCode, ...rest } = data;

  return prisma.package
    .create({
      data: {
        ...data,
        sale: {
          create: {
            amount: calculateAmount(data.weight),
          },
        },
      },
      include: {
        sale: true,
        region: {
          select: { code: true, name: true },
        },
      },
    })
    .catch(handlePrismaError);
};

export const updatePackageStatus = async (
  id: string,
  status: number,
  delayReason?: string,
) => {
  const packageStatus = resolveStatus(status);

  if (packageStatus === PackageStatus.DELAYED && !delayReason) {
    throw new Error("DELAY_REASON_REQUIRED");
  }

  return prisma.package
    .update({
      where: { id },
      data: {
        status: packageStatus,
        delayReason:
          packageStatus === PackageStatus.DELAYED ? delayReason : null,
      },
    })
    .catch(handlePrismaError);
};

export const createRawPackageUpdates = async (
  updates: RawPackageUpdateInput[],
) => {
  return prisma.rawPackageUpdate.createMany({
    data: updates,
  });
};

export const processRawUpdates = async () => {
  const updates = await prisma.rawPackageUpdate.findMany({
    where: {
      processed: false,
    },
  });
console.log("Updates:", updates.length);
  for (const update of updates) {
    await prisma.$transaction([
      prisma.package.updateMany({
        where: {
          trackingId: update.trackingId,
        },
        data: {
          status: update.status,
        },
      }),
      prisma.rawPackageUpdate.update({
        where: {
          id: update.id,
        },
        data: {
          processed: true,
        },
      }),
    ]);
  }
};