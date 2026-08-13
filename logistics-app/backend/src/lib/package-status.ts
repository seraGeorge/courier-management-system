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

/** Statuses Collection can push back (last-mile / customer-facing actions). */
export const CollectionToLogisticsAppStatusMap: Partial<
  Record<CollectionPackageStatus, PackageStatus>
> = {
  TO_BE_PICKED_UP: PackageStatus.TO_BE_PICKED_UP,
  PICKED_UP: PackageStatus.PICKED_UP,
  SCHEDULED_FOR_DELIVERY: PackageStatus.SCHEDULED_FOR_DELIVERY,
  OUT_FOR_DELIVERY: PackageStatus.OUT_FOR_DELIVERY,
  DELAYED: PackageStatus.DELAYED,
  DELIVERED: PackageStatus.DELIVERED,
  // PROCESSING / IN_TRANSIT are logistics aggregates — Collection must not set them.
} as const;

export const LOGISTICS_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  [PackageStatus.TO_BE_PICKED_UP]: [PackageStatus.PICKED_UP],

  [PackageStatus.PICKED_UP]: [PackageStatus.ADDED_TO_BAG],

  [PackageStatus.ADDED_TO_BAG]: [PackageStatus.LOADED_ON_TRUCK],

  [PackageStatus.LOADED_ON_TRUCK]: [PackageStatus.EN_ROUTE],

  [PackageStatus.EN_ROUTE]: [
    PackageStatus.ARRIVED_AT_REGION,
    PackageStatus.DELAYED,
  ],

  [PackageStatus.ARRIVED_AT_REGION]: [
    PackageStatus.SCHEDULED_FOR_DELIVERY,
    PackageStatus.ADDED_TO_BAG, // multi-hop
  ],

  [PackageStatus.SCHEDULED_FOR_DELIVERY]: [PackageStatus.OUT_FOR_DELIVERY],

  [PackageStatus.OUT_FOR_DELIVERY]: [PackageStatus.DELIVERED],

  [PackageStatus.DELAYED]: [
    PackageStatus.EN_ROUTE,
    PackageStatus.ARRIVED_AT_REGION,
  ],

  [PackageStatus.DELIVERED]: [],
};
