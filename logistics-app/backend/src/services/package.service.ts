import { prisma } from "@/lib/prisma";
import { PackageStatus } from "@shared/enums/package-status";
import { CreatePackageRequest } from "@shared/types/package";

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
      statusHistory:{
        create:{
          status: PackageStatus.TO_BE_PICKED_UP
        }
      }
    },
  });

  return packageData;
};
