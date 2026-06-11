import { Region } from "./region";

export type TrackResult = {
  trackingId: string;
  status: string;
  region: Region;
  delayReason: string | null;
  sale: {
    amount: number;
    createdAt: string;
  } | null;
};
