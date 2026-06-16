export const BagStatus = {
  OPEN: "OPEN",
  SEALED: "SEALED",
  LOADED: "LOADED",
  IN_TRANSIT: "IN_TRANSIT",
  ARRIVED: "ARRIVED",
  DELAYED: "DELAYED",
} as const;

export type BagStatus = (typeof BagStatus)[keyof typeof BagStatus];
