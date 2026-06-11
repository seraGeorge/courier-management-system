import { Region } from "@/types/region";
import API from "./api";

export const getRegions = async () => {
  return API.get<Region[]>("/regions");
};
