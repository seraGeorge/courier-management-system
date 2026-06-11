import API from "./api";
import type { DashboardData } from "@/types/dashboard";

export const getDashboard = async () => {
  return API.get<DashboardData>("/dashboard");
};
