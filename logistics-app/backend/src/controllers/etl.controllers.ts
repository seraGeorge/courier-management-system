import { Request, Response } from "express";
import { buildResponse } from "@/utils/response";
import { confirmPackageUpdateBatch } from "@/services/etl.service";
import { EtlConfirmSchema } from "@/validations/etl";

export const confirmPackageUpdates = async (req: Request, res: Response) => {
  const result = EtlConfirmSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(
      buildResponse(
        400,
        "Please fix the highlighted fields and try again.",
        null,
        {
          code: "VALIDATION_ERROR",
          fieldErrors: result.error.flatten().fieldErrors,
        },
      ),
    );
  }

  const { batchId, confirmations } = result.data;

  try {
    await confirmPackageUpdateBatch(batchId, confirmations);
    return res.json(buildResponse(200, "Batch confirmed successfully", null));
  } catch (err) {
    console.error("[ETL] Failed to confirm batch", err);
    return res.status(500).json(
      buildResponse(500, "Failed to confirm batch", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
