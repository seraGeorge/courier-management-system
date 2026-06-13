import { prisma } from "@/lib/prisma";
import {
  createTruck,
  getTrucks,
  loadBagToTruck,
} from "@/services/truck.service";
import { buildResponse } from "@/utils/response";
import { LoadBagToTruck } from "@/validations/truck";
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
    const trucks = await getTrucks();
    return res
      .status(201)
      .json(buildResponse(201, "Trucks retrieved successfully", trucks));
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
