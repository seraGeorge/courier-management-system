import { PackageStatus } from "@/generated/prisma/client";

export const StatusMap = {
  0: PackageStatus.TO_BE_PICKED_UP,
  1: PackageStatus.PICKED_UP,
  2: PackageStatus.ADDED_TO_BAG,
  3: PackageStatus.EN_ROUTE,
  4: PackageStatus.ARRIVED_AT_REGION,
  5: PackageStatus.SCHEDULED_FOR_DELIVERY,
  6: PackageStatus.OUT_FOR_DELIVERY,
  7: PackageStatus.DELAYED,
  8: PackageStatus.DELIVERED,
} as const;

export const LogisticsToCollectionAppStatusMap = {
  TO_BE_PICKED_UP: "TO_BE_PICKED_UP",
  PICKED_UP: "PICKED_UP",

  ADDED_TO_BAG: "IN_TRANSIT",
  LOADED_ON_TRUCK: "IN_TRANSIT",
  EN_ROUTE: "IN_TRANSIT",
  ARRIVED_AT_REGION: "IN_TRANSIT",

  SCHEDULED_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",

  DELAYED: "DELAYED",
  DELIVERED: "DELIVERED",
} as const;