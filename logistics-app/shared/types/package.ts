import { PackageStatus } from "../enums/package-status";
export interface CreatePackageRequest {
  trackingId: string;
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  regionCode: string;
}

export interface PackageResponse {
  id: string;
  trackingId: string;

  senderName: string;
  receiverName: string;

  fromAddress: string;
  toAddress: string;

  weight: number;

  status: PackageStatus;

  regionCode: string;

  bagId?: string | null;

  delayReason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface PackageStatusHistoryResponse {
  id: string;
  packageId: string;

  status: PackageStatus;

  remarks?: string | null;

  createdAt: Date;
}

export interface GetPackagesQuery {
  regionCode?: string;
  status?: PackageStatus;
  bagId?: string;
}
