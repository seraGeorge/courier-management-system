import { createRawPackageUpdates } from "@/services/package.service";
import { buildResponse } from "@/utils/response";
import { RawPackageUpdatesSchema } from "@/validations/rawPackage";
import type { Request, Response } from "express";

export const receiveRawUpdates = async (req: Request, res: Response) => {
  const result = RawPackageUpdatesSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: { updates: result.error.flatten().formErrors },
      }),
    );
  }

  try {
    const staged = await createRawPackageUpdates(result.data);
    return res
      .status(202) // accepted, not yet applied
      .json(buildResponse(202, "Updates staged for processing", staged));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Internal Server Error", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
