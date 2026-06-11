import { getRegionsList } from "@/services/region.service";
import { buildResponse } from "@/utils/response";
import { type Request, type Response } from "express";

export const getRegions = async (req: Request, res: Response) => {
  const regions = await getRegionsList();
  return res
    .status(200)
    .json(buildResponse(200, "Regions fetched successfully", regions));
};
