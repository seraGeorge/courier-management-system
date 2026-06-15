import { PackageStatus } from "../enums";

export interface LoadBagToTruckRequest {
  truckNumber: string;
  bagNumber: string;
}

export interface UpdatePackageStatusRequest {
  trackingId: string;
  status: PackageStatus;
}