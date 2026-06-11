import { createPackage } from "@/services/package.service";
import { buildResponse } from "@/utils/response";
import { CreatePackageSchema } from "@/validations/package";
import type { Request, Response } from "express";

export const addPackage = async (req: Request, res: Response) => {
  const result = CreatePackageSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  const newPackage = await createPackage(result.data);
  res
    .status(201)
    .json(buildResponse(201, "Package created successfully", newPackage));
};
