import {
  createBag,
  getBagDetailsByNumber,
  getBags,
} from "@/services/bag.service";
import { buildResponse } from "@/utils/response";
import { AssignPackageToBagSchema } from "@/validations/bag";
import type { Request, Response } from "express";
import { assignPackageToBag } from "@/services/bag.service";

export const addBag = async (req: Request, res: Response) => {
  const newBag = await createBag();
  res.status(201).json(buildResponse(201, "Bag created successfully", newBag));
};

export const addPackageToBag = async (req: Request, res: Response) => {
  const result = AssignPackageToBagSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  const updatedBag = await assignPackageToBag(result.data);
  res
    .status(200)
    .json(
      buildResponse(200, "Package assigned to bag successfully", updatedBag),
    );
};

export const listBags = async (req: Request, res: Response) => {
  try {
    const bags = await getBags();
    return res
      .status(200)
      .json(buildResponse(200, "Bags retrieved successfully", bags));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to retrieve bags", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const getBagDetails = async (req: Request, res: Response) => {
  try {
    const { bagNumber } = req.params;
    const bag = await getBagDetailsByNumber(bagNumber as string);
    return res
      .status(200)
      .json(buildResponse(200, "Bag details retrieved successfully", bag));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to retrieve bag details", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
