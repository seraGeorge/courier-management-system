import { BagStatus } from "../enums";
import { PackageResponse } from "./package";

export interface BagResponse {
  bagNumber: string;
  status: BagStatus;
  delayReason?: string | null;
  createdAt: Date;
  _count?: {
    packages: number;
  };
  packages?: Partial<PackageResponse>[];
}

export interface AssignPackageToBagRequest {
  trackingId: string;
  bagNumber: string;
}

export interface SealBagRequest {
  bagNumber: string;
}