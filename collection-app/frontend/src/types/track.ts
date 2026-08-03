import { Region } from "./region";
import type { PackageStatus } from "./package-status";

export type TrackHistoryEvent = {
  status: PackageStatus;
  delayReason: string | null;
  at: string;
};

export type TrackResult = {
  trackingId: string;
  status: PackageStatus;
  region: Region;
  delayReason: string | null;
  createdAt: string;
  sale: {
    amount: number;
    createdAt: string;
  } | null;
  history: TrackHistoryEvent[];
};
