import { type Request, type Response } from "express";
import { getDashboardData } from "../services/dashboard.service.js";
import { buildResponse } from "@/utils/response.js";

export const getDashboard = async (req: Request, res: Response) => {
  const data = await getDashboardData();

  return res
    .status(200)
    .json(buildResponse(200, "Dashboard data fetched successfully", data));
};
