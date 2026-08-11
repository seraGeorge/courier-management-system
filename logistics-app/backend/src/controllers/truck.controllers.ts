import { TruckStatus } from "@/generated/prisma/browser";
import { prisma } from "@/lib/prisma";
import {
  createTruck,
  getArrivedTruckDetailsByTruckNumber,
  getTruckDetailsByTruckNumber,
  getTrucks,
  loadBagToTruck,
  updateTruckStatus,
} from "@/services/truck.service";
import { buildResponse } from "@/utils/response";
import { LoadBagToTruck, UpdateTruckStatusSchema } from "@/validations/truck";
import type { Request, Response } from "express";

export const addTruck = async (req: Request, res: Response) => {
  try {
    const truck = await createTruck();
    return res
      .status(201)
      .json(buildResponse(201, "Truck created successfully", truck));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to create truck", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const listTrucks = async (req: Request, res: Response) => {
  try {
  const raw = req.query.status;

  const status =
    typeof raw === "string"
      ? raw.includes(",")
        ? (raw.split(",") as TruckStatus[])
        : (raw as TruckStatus)
      : undefined;

    const trucks = await getTrucks(status);
    return res
      .status(200)
      .json(buildResponse(200, "Trucks retrieved successfully", trucks));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to retrieve trucks", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const loadBag = async (req: Request, res: Response) => {
  const result = LoadBagToTruck.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  try {
    const truckData = await loadBagToTruck(result.data);
    return res
      .status(200)
      .json(buildResponse(200, "Bag loaded to truck successfully", truckData));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to load bag to truck", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const getTruckDetails = async (req: Request, res: Response) => {
  try {
    const truckNumber = req.params.truckNumber as string;
    const truck = await getTruckDetailsByTruckNumber(truckNumber);
    if (!truck) {
      return res.status(404).json(
        buildResponse(404, "Truck not found", null, {
          code: "TRUCK_NOT_FOUND",
        }),
      );
    }

    return res
      .status(200)
      .json(buildResponse(200, "Truck details retrieved successfully", truck));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to retrieve truck details", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const getArrivedTruckDetails = async (req: Request, res: Response) => {
  try {
    const truckNumber = req.params.truckNumber as string;
    const truck = await getArrivedTruckDetailsByTruckNumber(truckNumber);
    if (!truck) {
      return res.status(404).json(
        buildResponse(404, "Truck not found", null, {
          code: "TRUCK_NOT_FOUND",
        }),
      );
    }

    return res
      .status(200)
      .json(buildResponse(200, "Truck details retrieved successfully", truck));
  } catch (error) {
    return res.status(500).json(
      buildResponse(500, "Failed to retrieve truck details", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};

export const updateTruckStatusController = async (
  req: Request,
  res: Response,
) => {
  const result = UpdateTruckStatusSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(
      buildResponse(400, "Invalid request data", null, {
        code: "VALIDATION_ERROR",
        fieldErrors: result.error.flatten().fieldErrors,
      }),
    );
  }

  try {
    const { truckNumber } = req.params;

    const truck = await updateTruckStatus(
      truckNumber as string,
      result.data.status,
      result.data.delayReason,
    );

    return res
      .status(200)
      .json(buildResponse(200, "Truck status updated successfully", truck));
  } catch (error) {
    if (error instanceof Error && error.message === "DELAY_REASON_REQUIRED") {
      return res.status(400).json(
        buildResponse(400, "Delay reason is required when status is DELAYED", null, {
          code: "DELAY_REASON_REQUIRED",
        }),
      );
    }

    return res.status(500).json(
      buildResponse(500, "Failed to update truck", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
