import {
  getPackages,
  createPackage,
  updatePackageStatus,
} from "@/services/package.service";
import { buildResponse } from "@/utils/response";
import { CreatePackageSchema } from "@/validations/package";
import { UpdatePackageStatusSchema } from "@/validations/update-package-status";
import { type Request, type Response } from "express";

export const listPackages = async (req: Request, res: Response) => {
  try {
    const status = req.query.status ? Number(req.query.status) : undefined;
    const region = req.query.regionCode as string | undefined;
    const packages = await getPackages(status, region);

    res
      .status(200)
      .json(buildResponse(200, "Packages retrieved successfully", packages));
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_STATUS") {
      return res
        .status(400)
        .json(
          buildResponse(400, "Invalid request data", null, "VALIDATION_ERROR"),
        );
    }

    return res
      .status(500)
      .json(
        buildResponse(
          500,
          "Internal Server Error",
          null,
          "INTERNAL_SERVER_ERROR",
        ),
      );
  }
};

export const addPackage = async (req: Request, res: Response) => {
  const result = CreatePackageSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json(
        buildResponse(
          400,
          "Invalid request data",
          null,
          "VALIDATION_ERROR",
          result.error.flatten().fieldErrors,
        ),
      );
  }

  const newPackage = await createPackage(result.data);
  res
    .status(201)
    .json(buildResponse(201, "Package created successfully", newPackage));
};

export const patchPackageStatus = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json(
        buildResponse(400, "Package ID is required", null, "VALIDATION_ERROR"),
      );
  }

  const result = UpdatePackageStatusSchema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json(
        buildResponse(
          400,
          "Invalid request data",
          null,
          "VALIDATION_ERROR",
          result.error.flatten().fieldErrors,
        ),
      );
  }

  try {
    const updatedPackage = await updatePackageStatus(
      id.toString(),
      result.data.status,
      result.data.delayReason,
    );

    return res
      .status(200)
      .json(
        buildResponse(200, "Package status updated successfully", [
          updatedPackage,
        ]),
      );
  } catch (error) {
    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return res
        .status(404)
        .json(
          buildResponse(404, "Package not found", null, "PACKAGE_NOT_FOUND"),
        );
    }

    return res
      .status(500)
      .json(
        buildResponse(
          500,
          "Internal Server Error",
          null,
          "INTERNAL_SERVER_ERROR",
        ),
      );
  }
};
