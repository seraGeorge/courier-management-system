import API from "./api";
import type { Package } from "@/types/package";

export type CreatePackageInput = {
  senderName: string;
  receiverName: string;
  fromAddress: string;
  toAddress: string;
  weight: number;
  regionCode: string;
};

export const createPackage = async (data: CreatePackageInput) => {
  return API.post<Package, CreatePackageInput>("/packages", data);
};
