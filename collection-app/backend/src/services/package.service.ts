import { prisma } from "@/lib/prisma";
import { PackageStatus, Prisma } from "@/generated/prisma/client";
import { StatusMap } from "@/lib/constants/package-status";

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

export const getPackages = async (statusParam?: number, region?: string) => {
  const whereClause: { status?: PackageStatus; region?: string } = {};

  if (statusParam !== undefined) {
    whereClause.status = resolveStatus(statusParam);
  }

  if (region) {
    whereClause.region = region;
  }

  return prisma.package.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
};

export const createPackage = async (data: {
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  region: string;
}) => {
  return prisma.package.create({
    data: { ...data, trackingId: crypto.randomUUID() },
  });
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
