
export interface BagResponse {
  bagNumber: string;
  status: string;
  createdAt: Date;
}

export interface AssignPackageToBagRequest {
  trackingId: string;
  bagNumber: string;
}