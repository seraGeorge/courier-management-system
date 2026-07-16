import { Region } from "./region";
import { PackageStatus } from "./package-status";

export interface Package {
  trackingId: string;
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  region: Region;
  status: PackageStatus;
  delayReason: string | null;
  createdAt: string;
};
