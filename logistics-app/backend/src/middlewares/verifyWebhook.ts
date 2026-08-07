import { getCustomerByApiKey } from "@/services/customer.service";
import { generateSignature } from "@/utils/hmac";
import { buildResponse } from "@/utils/response";
import { NextFunction, Request, Response } from "express";
import * as crypto from "node:crypto";

export const verifyWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.header("x-api-key");
  const receivedSignature = req.header("x-signature");
  if (!apiKey || !receivedSignature) {
    return res.status(401).json(
      buildResponse(401, "Missing authentication headers", null, {
        code: "UNAUTHORIZED",
      }),
    );
  }
  try {
    //The request contains: x-api-key: pk_xxxxx
    const customer = await getCustomerByApiKey(apiKey);
    if (!customer) {
      return res.status(401).json(
        buildResponse(401, "Invalid API key", null, {
          code: "UNAUTHORIZED",
        }),
      );
    }

    const rawBody = req.rawBody?.toString("utf8") ?? JSON.stringify(req.body);
    const expectedSignature = generateSignature(rawBody, customer.secretKey);

    if (expectedSignature.length !== receivedSignature.length) {
      return res.status(403).json(
        buildResponse(403, "Invalid signature", null, {
          code: "INVALID_SIGNATURE",
        }),
      );
    }

    // Javascript === comparison stops as soon as it finds a mismatch, which can lead to timing attacks. timingSafeEqual() compares the entire value in constant time regardless of where the first difference occurs, making that attack much harder.
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    );

    if (!isValid) {
      return res.status(403).json(
        buildResponse(403, "Invalid signature", null, {
          code: "INVALID_SIGNATURE",
        }),
      );
    }
    req.customer = customer;
    next();
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "INVALID_API_KEY") {
      return res.status(401).json(
        buildResponse(401, "Invalid API key", null, {
          code: "UNAUTHORIZED",
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
