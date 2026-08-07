import { generateSignature } from "@/utils/hmac";
import { buildResponse } from "@/utils/response";
import { NextFunction, Request, Response } from "express";
import * as crypto from "node:crypto";

export const verifyWebhook = (
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

  const expectedApiKey = process.env.LOGISTICS_API_KEY?.trim();
  const secretKey = process.env.LOGISTICS_SECRET_KEY?.trim();

  if (!expectedApiKey || !secretKey) {
    return res.status(500).json(
      buildResponse(500, "Webhook credentials are not configured", null, {
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

  const rawBody = req.rawBody?.toString("utf8") ?? JSON.stringify(req.body);
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
