import { createPackage, getLatestArrivalPackages, getLoadedPackages, getPackages, updatePackageStatusByTrackingId } from "@/services/package.service";
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
export const updatePackageStatus = async (req: Request, res: Response) => {
  const result = UpdatePackageStatusSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  try {
    const data = {
      trackingId: req.params.trackingId,
      status: result.data.status,
    };

    const updatedPackage = await updatePackageStatusByTrackingId({
      trackingId: data.trackingId.toString(),
      status: data.status,
    });
    return res
      .status(200)
      .json(
        buildResponse(
          200,
          "Package status updated successfully",
          updatedPackage,
        ),
      );
  } catch (error) {
    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return res.status(404).json(
        buildResponse(404, "Package not found", null, {
          code: "PACKAGE_NOT_FOUND",
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

export const listLatestArrivalPackages = async (
  req: Request,
  res: Response,
) => {
  try {
    const packages = await getLatestArrivalPackages();

    return res
      .status(200)
      .json(
        buildResponse(
          200,
          "Latest arrival packages retrieved successfully",
          packages,
        ),
      );
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to retrieve latest arrival packages", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
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