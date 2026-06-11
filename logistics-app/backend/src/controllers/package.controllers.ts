import { createPackage, getPackages } from "@/services/package.service";
import { buildResponse } from "@/utils/response";
import { CreatePackageSchema } from "@/validations/package";
import type { Request, Response } from "express";

export const listPackages = async (req: Request, res: Response) => {
  try {
    const status =
      req.query.status !== undefined
        ? Number(req.query.status)
        : undefined;

    const region = req.query.regionCode as string | undefined;

    const packages = await getPackages(status, region);

    res.status(200).json(
      buildResponse(
        200,
        "Packages retrieved successfully",
        packages
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_STATUS") {
      return res.status(400).json(
        buildResponse(400, "Invalid request data", null, {
          code: "VALIDATION_ERROR",
        }),
      );
    }

    return res.status(500).json(
      buildResponse(500, "Internal Server Error", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
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
