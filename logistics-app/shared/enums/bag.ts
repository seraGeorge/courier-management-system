export const BagStatus = {
  OPEN: "OPEN",
  SEALED: "SEALED",
  IN_TRANSIT: "IN_TRANSIT",
  ARRIVED: "ARRIVED",
  DELAYED: "DELAYED",
} as const;

export type BagStatus = (typeof BagStatus)[keyof typeof BagStatus];
