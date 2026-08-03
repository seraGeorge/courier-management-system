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

/** Linear customer-facing track steps (DELAYED is a side state, not a step). */
export const PACKAGE_TRACK_STEPS: Exclude<PackageStatus, "DELAYED">[] = [
  "TO_BE_PICKED_UP",
  "PICKED_UP",
  "PROCESSING",
  "IN_TRANSIT",
  "SCHEDULED_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
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

export const PACKAGE_STATUS_DESCRIPTIONS: Record<PackageStatus, string> = {
  TO_BE_PICKED_UP:
    "Your package has been registered and is waiting to be picked up.",
  PICKED_UP: "The package has been collected from the sender.",
  PROCESSING:
    "The package is being sorted and prepared for transport at the origin hub.",
  IN_TRANSIT: "The package is traveling toward the destination region.",
  SCHEDULED_FOR_DELIVERY: "Delivery has been scheduled in your area.",
  OUT_FOR_DELIVERY: "A courier has the package and is delivering it today.",
  DELAYED: "Delivery is temporarily delayed.",
  DELIVERED: "The package has been delivered successfully.",
};

/** Intermediate logistics activity nested under aggregate collection statuses. */
export const PACKAGE_STATUS_SUBSTEPS: Partial<
  Record<PackageStatus, string[]>
> = {
  PROCESSING: [
    "Sorted and added to a transport bag",
    "Loaded onto a delivery truck",
  ],
  IN_TRANSIT: [
    "En route between hubs",
    "Arrived at the destination region hub",
  ],
};
