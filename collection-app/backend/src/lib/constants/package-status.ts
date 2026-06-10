import { PackageStatus } from "@/generated/prisma/client";

export const StatusMap = {
  0: PackageStatus.TO_BE_PICKED_UP,
  1: PackageStatus.PICKED_UP,
  2: PackageStatus.IN_TRANSIT,
  3: PackageStatus.DELAYED,
  4: PackageStatus.DELIVERED,
} as const;
