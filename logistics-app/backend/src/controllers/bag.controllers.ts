import {
  completeBagByNumber,
  createBag,
  delayBagByNumber,
  getBagDetailsByNumber,
  getBags,
  sealBagByBagNumber,
} from "@/services/bag.service";
import { buildResponse } from "@/utils/response";
import {
  AssignPackageToBagSchema,
  DelayBagSchema,
  SealBagSchema,
} from "@/validations/bag";
import type { Request, Response } from "express";
import { assignPackageToBag } from "@/services/bag.service";
import { InvalidTransitionError } from "@/lib/package-state-machine";

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

  try {
    const updatedBag = await assignPackageToBag(result.data);
    res
      .status(200)
      .json(
        buildResponse(200, "Package assigned to bag successfully", updatedBag),
      );
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return res.status(400).json(
        buildResponse(400, "Invalid status transition", null, {
          code: "INVALID_TRANSITION",
          details: error.reason,
        }),
      );
    }

    if (error instanceof Error && error.message === "BAG_NOT_FOUND") {
      return res.status(404).json(
        buildResponse(404, "Bag not found", null, {
          code: "BAG_NOT_FOUND",
        }),
      );
    }

    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return res.status(404).json(
        buildResponse(404, "Package not found", null, {
          code: "PACKAGE_NOT_FOUND",
        }),
      );
    }

    return res.status(500).json(
      buildResponse(500, "Failed to assign package to bag", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
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
    if (!bag) {
      return res.status(404).json(
        buildResponse(404, "Bag not found", null, {
          code: "BAG_NOT_FOUND",
        }),
      );
    }

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

export const sealBag = async (req: Request, res: Response) => {
  const result = SealBagSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  try {
    const { bagNumber } = result.data;
    const bag = await sealBagByBagNumber(bagNumber as string);
    return res
      .status(200)
      .json(buildResponse(200, "Bag sealed successfully", bag));
  } catch (error) {
    console.error(error);
    return res.status(500).json(
      buildResponse(500, "Failed to seal bag", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const delayBag = async (req: Request, res: Response) => {
  const result = DelayBagSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  try {
    const bag = await delayBagByNumber(result.data);
    return res
      .status(200)
      .json(buildResponse(200, "Bag delayed successfully", bag));
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return res.status(400).json(
        buildResponse(400, "Invalid status transition", null, {
          code: "INVALID_TRANSITION",
          details: error.reason,
        }),
      );
    }

    if (error instanceof Error && error.message === "BAG_NOT_FOUND") {
      return res.status(404).json(
        buildResponse(404, "Bag not found", null, {
          code: "BAG_NOT_FOUND",
        }),
      );
    }

    if (error instanceof Error && error.message === "EMPTY_BAG") {
      return res.status(400).json(
        buildResponse(400, "Cannot delay an empty bag", null, {
          code: "EMPTY_BAG",
        }),
      );
    }

    console.error(error);
    return res.status(500).json(
      buildResponse(500, "Failed to delay bag", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const completeBag = async (req: Request, res: Response) => {
  try {
    const { bagNumber } = req.params;

    const bag = await completeBagByNumber(bagNumber as string);

    return res
      .status(200)
      .json(buildResponse(200, "Bag completed successfully", bag));
  } catch (error) {
    if (error instanceof Error && error.message === "BAG_NOT_FOUND") {
      return res.status(404).json(
        buildResponse(404, "Bag not found", null, {
          code: "BAG_NOT_FOUND",
        }),
      );
    }

    return res.status(500).json(
      buildResponse(500, "Failed to complete bag", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
