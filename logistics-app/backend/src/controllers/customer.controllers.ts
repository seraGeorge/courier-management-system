import { buildResponse } from "@/utils/response";
import { CreateCustomerSchema } from "@/validations/customer";
import { Request, Response } from "express";
import { createCustomer as createCustomerService } from "@/services/customer.service";

const omitSecretKey = <T extends { secretKey?: string }>(
  customer: T,
): Omit<T, "secretKey"> => {
  const { secretKey: _secretKey, ...safe } = customer;
  return safe;
};

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
      .json(
        buildResponse(
          201,
          "Customer created successfully",
          omitSecretKey(customer),
        ),
      );
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "CUSTOMER_ALREADY_EXISTS") {
      return res.status(409).json(
        buildResponse(409, "Customer already exists", null, {
          code: "CUSTOMER_ALREADY_EXISTS",
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
