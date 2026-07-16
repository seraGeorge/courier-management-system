import { PackageStatus } from "@/generated/prisma/client";

export type CollectionPackageStatus =
  | "TO_BE_PICKED_UP"
  | "PICKED_UP"
  | "PROCESSING"
  | "IN_TRANSIT"
  | "SCHEDULED_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELAYED"
  | "DELIVERED";
export const StatusMap = {
  0: PackageStatus.TO_BE_PICKED_UP,
  1: PackageStatus.PICKED_UP,
  2: PackageStatus.ADDED_TO_BAG,
  3: PackageStatus.LOADED_ON_TRUCK,
  4: PackageStatus.EN_ROUTE,
  5: PackageStatus.ARRIVED_AT_REGION,
  6: PackageStatus.SCHEDULED_FOR_DELIVERY,
  7: PackageStatus.OUT_FOR_DELIVERY,
  8: PackageStatus.DELAYED,
  9: PackageStatus.DELIVERED,
} as const;
export const LogisticsToCollectionAppStatusMap: Record<
  PackageStatus,
  CollectionPackageStatus
> = {
  TO_BE_PICKED_UP: "TO_BE_PICKED_UP",
  PICKED_UP: "PICKED_UP",

  ADDED_TO_BAG: "PROCESSING",
  LOADED_ON_TRUCK: "PROCESSING",

  EN_ROUTE: "IN_TRANSIT",
  ARRIVED_AT_REGION: "IN_TRANSIT",

  SCHEDULED_FOR_DELIVERY: "SCHEDULED_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",

  DELAYED: "DELAYED",
  DELIVERED: "DELIVERED",
} as const;
