import { Region } from "./region";

export interface Package {
  trackingId: string;
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  region: Region;
  status: string;
  delayReason: string | null;
  createdAt: string;
};
