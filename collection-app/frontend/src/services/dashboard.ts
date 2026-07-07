import API from "./api";
import type { DashboardData } from "@/types/dashboard";

export const getDashboard = async () => {
  return API.get<DashboardData>("/dashboard");
};

export const updatePackageStatus = async (
  trackingId: string,
  status: number,
) => {
  return API.patch(`/packages/${trackingId}/status`, {
    status,
  });
};