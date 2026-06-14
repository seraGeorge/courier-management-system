
export interface BagResponse {
  bagNumber: string;
  status: string;
  createdAt: Date;
  _count?: {
    packages: number;
  };
}

export interface AssignPackageToBagRequest {
  trackingId: string;
  bagNumber: string;
}

export interface SealBagRequest {
  bagNumber: string;
}