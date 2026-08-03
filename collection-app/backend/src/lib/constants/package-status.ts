import { PackageStatus } from "@/generated/prisma/client";

export const StatusMap = {
  0: PackageStatus.TO_BE_PICKED_UP,
  1: PackageStatus.PICKED_UP,
  2: PackageStatus.PROCESSING,
  3: PackageStatus.IN_TRANSIT,
  4: PackageStatus.DELAYED,
  5: PackageStatus.SCHEDULED_FOR_DELIVERY,
  6: PackageStatus.OUT_FOR_DELIVERY,
  7: PackageStatus.DELIVERED,
} as const;

/** Statuses Collection owns and must push back to Logistics. */
export const COLLECTION_OWNED_STATUSES: ReadonlySet<PackageStatus> = new Set([
  PackageStatus.SCHEDULED_FOR_DELIVERY,
  PackageStatus.OUT_FOR_DELIVERY,
  PackageStatus.DELAYED,
  PackageStatus.DELIVERED,
]);
