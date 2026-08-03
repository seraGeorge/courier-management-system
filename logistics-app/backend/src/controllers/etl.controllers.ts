import { Request, Response } from "express";
import { buildResponse } from "@/utils/response";
import { confirmPackageUpdateBatch } from "@/services/etl.service";

export const confirmPackageUpdates = async (req: Request, res: Response) => {
  const { batchId, confirmations } = req.body;

  await confirmPackageUpdateBatch(batchId, confirmations);

  return res.json(buildResponse(200, "Batch confirmed successfully", null));
};
