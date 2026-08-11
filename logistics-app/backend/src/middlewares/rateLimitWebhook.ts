import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { buildResponse } from "@/utils/response";

/**
 * Rate limits webhook requests, keyed by the caller's API key rather than IP —
 * webhook senders can call from shared/rotating infra IPs, so IP isn't a
 * reliable per-caller bucket the way it is for public browser traffic.
 *
 * Policy:
 * - 100 requests per API key
 * - 1-minute window
 * - Returns HTTP 429 when the limit is exceeded
 */
export const rateLimitWebhook = rateLimit({
  windowMs: 60_000,
  limit: 100,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => req.header("x-api-key") ?? "unknown",

  handler: (_req: Request, res: Response) => {
    return res.status(429).json(
      buildResponse(
        429,
        "Too many webhook requests. Please try again later.",
        null,
        {
          code: "RATE_LIMITED",
        },
      ),
    );
  },
});
