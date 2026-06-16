export const TruckStatus = {
  SCHEDULED: "SCHEDULED",
  LOADED: "LOADED",
  DEPARTED: "DEPARTED",
  ARRIVED: "ARRIVED",
  DELAYED: "DELAYED",
} as const;

export type TruckStatus = (typeof TruckStatus)[keyof typeof TruckStatus];
