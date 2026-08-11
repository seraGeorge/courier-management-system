import { generateSignature } from "@/utils/hmac";
import { buildResponse } from "@/utils/response";
import { NextFunction, Request, Response } from "express";
import * as crypto from "node:crypto";

export const verifyStaffAuth = (
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

  const expectedApiKey = process.env.STAFF_API_KEY?.trim();
  const secretKey = process.env.STAFF_SECRET_KEY?.trim();

  if (!expectedApiKey || !secretKey) {
    return res.status(500).json(
      buildResponse(500, "Staff credentials are not configured", null, {
        code: "INTERNAL_SERVER_ERROR",
      }),
    );
  }

  if (apiKey !== expectedApiKey) {
    return res.status(401).json(
      buildResponse(401, "Invalid API key", null, {
        code: "UNAUTHORIZED",
      }),
    );
  }

  const rawBody =
    req.rawBody && req.rawBody.length > 0
      ? req.rawBody.toString("utf8")
      : "";
  const expectedSignature = generateSignature(rawBody, secretKey);

  if (expectedSignature.length !== receivedSignature.length) {
    return res.status(403).json(
      buildResponse(403, "Invalid signature", null, {
        code: "INVALID_SIGNATURE",
      }),
    );
  }

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

  next();
};
