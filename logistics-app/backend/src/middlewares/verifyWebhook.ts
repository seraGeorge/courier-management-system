import { getCustomerByApiKey } from "@/services/customer.service";
import { generateSignature } from "@/utils/hmac";
import { buildResponse } from "@/utils/response";
import { NextFunction, Request, Response } from "express";
export const verifyWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.header("x-api-key");
  const receivedSignature = req.header("x-signature");
  if (!apiKey) {
    return res.status(401).json(
      buildResponse(401, "Missing authentication headers", null, {
        code: "UNAUTHORIZED",
      }),
    );
  }
  //The request contains: x-api-key: pk_xxxxx
  const customer = await getCustomerByApiKey(apiKey);
  if (!customer) {
    return res.status(401).json(
      buildResponse(401, "Invalid API key", null, {
        code: "UNAUTHORIZED",
      }),
    );
  }

  //   Generate expected signature
  const expectedSignature = generateSignature(
    JSON.stringify(req.body),
    customer.secretKey,
  );

  if (expectedSignature !== receivedSignature) {
    return res.status(403).json(
      buildResponse(403, "Invalid signature", null, {
        code: "INVALID_SIGNATURE",
      }),
    );
  }
  req.customer = customer;
  next();
};
