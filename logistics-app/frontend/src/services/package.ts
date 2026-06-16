import { PackageStatus } from "@shared/enums/index";
import { api } from "./api";

export const getPackages = async () => {
  const response = await api.get("/packages");

  return response.data;
};

export const getLoadedPackages = async () => {
  const response = await api.get("/packages/loaded");

  return response.data;
};

export const assignPackageToBag = async (
  trackingId: string,
  bagNumber: string,
) => {
  const response = await api.post("/bags/assign", {
    trackingId,
    bagNumber,
  });

  return response.data;
};

export const updatePackageStatus = async (
  trackingId: string,
  status: PackageStatus,
) => {
  const response = await api.patch(`/packages/${trackingId}/status`, {
    status,
  });

  return response.data;
};

export const createPackage = async () => {
  const response = await api.post("/packages");

  return response.data;
};