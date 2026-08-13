/**
 * Collection Package Status Constants
 * 
 * Defines status mappings and valid transitions for the Collection app.
 */

export type CollectionPackageStatus =
  | "TO_BE_PICKED_UP"
  | "PICKED_UP"
  | "PROCESSING"
  | "IN_TRANSIT"
  | "SCHEDULED_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELAYED"
  | "DELIVERED";

/**
 * Valid transitions for Collection app package statuses.
 * Collection can only directly transition certain customer-facing states.
 */
export const COLLECTION_TRANSITIONS: Record<
  CollectionPackageStatus,
  CollectionPackageStatus[]
> = {
  // Initial state
  ["TO_BE_PICKED_UP"]: ["PICKED_UP"],

  // Pickup stage
  ["PICKED_UP"]: ["PROCESSING"],

  // Aggregate of ADDED_TO_BAG + LOADED_ON_TRUCK
  ["PROCESSING"]: ["IN_TRANSIT"],

  // Aggregate of EN_ROUTE + ARRIVED_AT_REGION
  ["IN_TRANSIT"]: [
    "SCHEDULED_FOR_DELIVERY",
    "DELAYED",
  ],

  // Final mile scheduling (Collection owns)
  ["SCHEDULED_FOR_DELIVERY"]: ["OUT_FOR_DELIVERY"],

  // Final delivery attempt (Collection owns)
  ["OUT_FOR_DELIVERY"]: ["DELIVERED"],

  // DELAYED overlay — can resolve to IN_TRANSIT only
  ["DELAYED"]: ["IN_TRANSIT"],

  // Terminal
  ["DELIVERED"]: [],
};
