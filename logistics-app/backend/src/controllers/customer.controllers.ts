import { buildResponse } from "@/utils/response";
import { CreateCustomerSchema } from "@/validations/customer";
import {Request, Response} from "express";
import { createCustomer as createCustomerService } from "@/services/customer.service";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const result = CreateCustomerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(
        buildResponse(400, "Invalid request data", null, {
          code: "VALIDATION_ERROR",
          fieldErrors: result.error.flatten().fieldErrors,
        }),
      );
    }

    const customer = await createCustomerService(result.data);

    return res
      .status(201)
      .json(buildResponse(201, "Customer created successfully", customer));
  } catch (error) {
    console.error(error);

    return res.status(500).json(
      buildResponse(500, "Internal Server Error", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }
};
