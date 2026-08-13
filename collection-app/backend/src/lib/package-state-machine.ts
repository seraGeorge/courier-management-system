import { PackageStatus } from "@/generated/prisma/client";
import { COLLECTION_TRANSITIONS, type CollectionPackageStatus } from "./package-status";

// Re-export for backward compatibility
export type { CollectionPackageStatus } from "./package-status";

/**
 * Package State Machine for Collection App
 * 
 * Defines valid state transitions for package statuses in Collection context.
 * Derived from COLLECTION_TRANSITIONS constant in package-status.ts
 */

/**
 * Build COLLECTION_VALID_TRANSITIONS from the existing COLLECTION_TRANSITIONS constant.
 * Converts array format to Set format for efficient lookup.
 */
function buildCollectionValidTransitions(): Record<
  CollectionPackageStatus,
  Set<CollectionPackageStatus>
> {
  const transitions: Record<
    CollectionPackageStatus,
    Set<CollectionPackageStatus>
  > = {} as any;

  for (const [currentStatus, nextStates] of Object.entries(
    COLLECTION_TRANSITIONS
  )) {
    transitions[currentStatus as CollectionPackageStatus] = new Set(
      nextStates as CollectionPackageStatus[]
    );
  }

  return transitions;
}

/**
 * Valid transitions for Collection app package statuses.
 * Collection can only directly transition certain customer-facing states.
 * Derived from COLLECTION_TRANSITIONS in package-status.ts
 */
export const COLLECTION_VALID_TRANSITIONS =
  buildCollectionValidTransitions();

/**
 * Validation result returned by transition checks.
 */
export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
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
    reason: `Transition ${currentStatus} → ${newStatus} is not allowed`,
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
