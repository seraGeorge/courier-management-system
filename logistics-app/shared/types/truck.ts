import { PackageStatus } from "../enums";
import { TruckStatus } from "../enums/truck";
import { BagResponse } from "./bag";

export interface LoadBagToTruckRequest {
  truckNumber: string;
  bagNumber: string;
}

export interface UpdatePackageStatusRequest {
  trackingId: string;
  status: PackageStatus;
  delayReason?: string;
}
export interface TruckBagResponse {
  bag: BagResponse;
}
export interface TruckResponse {
  truckNumber: string;
  status: TruckStatus;
  truckBags: TruckBagResponse[];
}
