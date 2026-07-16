export type PackageStatus =
  | "TO_BE_PICKED_UP"
  | "PICKED_UP"
  | "PROCESSING"
  | "IN_TRANSIT"
  | "SCHEDULED_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELAYED"
  | "DELIVERED";

export const PACKAGE_STATUS_FLOW: PackageStatus[] = [
  "TO_BE_PICKED_UP",
  "PICKED_UP",
  "PROCESSING",
  "IN_TRANSIT",
  "SCHEDULED_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELAYED",
  "DELIVERED",
];

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  TO_BE_PICKED_UP: "Awaiting Pickup",
  PICKED_UP: "Picked Up",
  PROCESSING: "Processing",
  IN_TRANSIT: "In Transit",
  SCHEDULED_FOR_DELIVERY: "Scheduled for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELAYED: "Delayed",
  DELIVERED: "Delivered",
};
