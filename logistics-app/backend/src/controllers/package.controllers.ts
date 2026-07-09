import { verifyWebhook } from "@/middlewares/verifyWebhook";
import {
  createPackage,
  getLoadedPackages,
  getPackages,
} from "@/services/package.service";
import { buildResponse } from "@/utils/response";
import {
  CreatePackageSchema,
  UpdatePackageStatusSchema,
} from "@/validations/package";
import type { Request, Response } from "express";

export const listPackages = async (req: Request, res: Response) => {
  try {
    const status =
      req.query.status !== undefined ? Number(req.query.status) : undefined;

    const region = req.query.regionCode as string | undefined;

    const packages = await getPackages(status, region);

    res
      .status(200)
      .json(buildResponse(200, "Packages retrieved successfully", packages));
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
export const receivePackageWebhook = async (req: Request, res: Response) => {
  console.log("Webhook hit");
  console.log(req.body);

  try {
    const result = CreatePackageSchema.safeParse(req.body);

    if (!result.success) {
      console.log(result.error.flatten());

      return res.status(400).json(
        buildResponse(400, "Invalid request data", null, {
          code: "VALIDATION_ERROR",
          fieldErrors: result.error.flatten().fieldErrors,
        }),
      );
    }
    const newPackage = await createPackage(result.data, req.customer.id);

    return res
      .status(201)
      .json(buildResponse(201, "Package created successfully", newPackage));
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    return res.status(500).json({
      message: error instanceof Error ? error.message : error,
    });
  }
};

export const listLoadedPackages = async (req: Request, res: Response) => {
  try {
    const packages = await getLoadedPackages();

    return res
      .status(200)
      .json(
        buildResponse(200, "Loaded packages retrieved successfully", packages),
      );
  } catch (error) {
    console.error(error);

    return res.status(500).json(
      buildResponse(500, "Internal Server Error", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
