import { PackageStatus } from "@/generated/prisma/client";
import { LOGISTICS_TRANSITIONS } from "./package-status";

/**
 * Package State Machine
 * 
 * Defines valid state transitions for package statuses across Collection and Logistics apps.
 * Enforces strict rules:
 * - No regressions (e.g., DELIVERED → IN_TRANSIT forbidden)
 * - DELAYED overlay (can transition from specific states)
 * - Monotonic progression through core states
 */

/**
 * Build LOGISTICS_VALID_TRANSITIONS from the existing LOGISTICS_TRANSITIONS constant.
 * Converts array format to Set format for efficient lookup.
 */
function buildLogisticsValidTransitions(): Record<
  PackageStatus,
  Set<PackageStatus>
> {
  const transitions: Record<PackageStatus, Set<PackageStatus>> = {} as any;

  for (const [currentStatus, nextStates] of Object.entries(
    LOGISTICS_TRANSITIONS
  )) {
    transitions[currentStatus as PackageStatus] = new Set(
      nextStates as PackageStatus[]
    );
  }

  return transitions;
}

/**
 * Valid transitions for Logistics app package statuses.
 * Maps from current state to set of allowed next states.
 * Derived from LOGISTICS_TRANSITIONS in package-status.ts
 */
export const LOGISTICS_VALID_TRANSITIONS = buildLogisticsValidTransitions();

/**
 * Collection app statuses (simplified, customer-facing).
 * Note: These map to Logistics statuses but collection can only update certain states.
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
export const COLLECTION_VALID_TRANSITIONS: Record<
  CollectionPackageStatus,
  Set<CollectionPackageStatus>
> = {
  // Initial state
  ["TO_BE_PICKED_UP"]: new Set([
    "PICKED_UP",
  ]),

  // Pickup stage
  ["PICKED_UP"]: new Set([
    "PROCESSING",
  ]),

  // Aggregate of ADDED_TO_BAG + LOADED_ON_TRUCK
  ["PROCESSING"]: new Set([
    "IN_TRANSIT",
  ]),

  // Aggregate of EN_ROUTE + ARRIVED_AT_REGION
  ["IN_TRANSIT"]: new Set([
    "SCHEDULED_FOR_DELIVERY",
    "DELAYED",
  ]),

  // Final mile scheduling (Collection owns)
  ["SCHEDULED_FOR_DELIVERY"]: new Set([
    "OUT_FOR_DELIVERY",
  ]),

  // Final delivery attempt (Collection owns)
  ["OUT_FOR_DELIVERY"]: new Set([
    "DELIVERED",
  ]),

  // DELAYED overlay — can resolve to IN_TRANSIT only
  ["DELAYED"]: new Set([
    "IN_TRANSIT",
  ]),

  // Terminal
  ["DELIVERED"]: new Set(),
};

/**
 * Validation result returned by transition checks.
 */
export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Check if a transition is valid in the Logistics context.
 *
 * @param currentStatus Current package status
 * @param newStatus Desired new status
 * @returns Validation result
 */
export function isValidLogisticsTransition(
  currentStatus: PackageStatus,
  newStatus: PackageStatus,
): TransitionValidationResult {
  // No-op transitions are valid
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = LOGISTICS_VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return {
      valid: false,
      reason: `Unknown current status: ${currentStatus}`,
    };
  }

  if (allowedTransitions.has(newStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Transition ${currentStatus} → ${newStatus} is not allowed`,
  };
}

/**
 * Check if a transition is valid in the Collection context.
 *
 * @param currentStatus Current package status (Collection representation)
 * @param newStatus Desired new status (Collection representation)
 * @returns Validation result
 */
export function isValidCollectionTransition(
  currentStatus: CollectionPackageStatus,
  newStatus: CollectionPackageStatus,
): TransitionValidationResult {
  // No-op transitions are valid
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = COLLECTION_VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions) {
    return {
      valid: false,
      reason: `Unknown current status: ${currentStatus}`,
    };
  }

  if (allowedTransitions.has(newStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Transition ${currentStatus} → ${newStatus} is not allowed in Collection app`,
  };
}

/**
 * Error thrown when a state machine constraint is violated.
 */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly currentStatus: string,
    public readonly newStatus: string,
    public readonly reason: string,
  ) {
    super(`Invalid transition: ${currentStatus} → ${newStatus}. Reason: ${reason}`);
    this.name = "InvalidTransitionError";
  }
}

/**
 * Error thrown when an ETL event is stale (older than the current status's timestamp).
 */
export class StaleEtlEventError extends Error {
  constructor(
    public readonly eventOccurredAt: Date,
    public readonly currentStatusAt: Date,
  ) {
    super(
      `ETL event occurred at ${eventOccurredAt.toISOString()} but current status was set at ${currentStatusAt.toISOString()}`
    );
    this.name = "StaleEtlEventError";
  }
}

/**
 * Validate that an ETL event is not stale.
 * Events should be applied in monotonically increasing timestamp order.
 *
 * @param eventOccurredAt When the event occurred (in source system)
 * @param currentStatusTimestamp When the current status was set
 * @returns true if the event is valid (not stale)
 */
export function isEventStale(
  eventOccurredAt: Date,
  currentStatusTimestamp: Date,
): boolean {
  // If the event occurred before the current status was set, it's stale
  return eventOccurredAt < currentStatusTimestamp;
}
