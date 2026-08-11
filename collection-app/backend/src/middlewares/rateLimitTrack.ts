import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { buildResponse } from "@/utils/response";

/**
 * Rate limits tracking requests to prevent excessive requests from a client.
 *
 * Uses express-rate-limit to handle request counting, window expiration,
 * and limit enforcement internally.
 *
 * Policy:
 * - 10 requests per IP
 * - 1-minute sliding/fixed window managed by the configured store
 * - Returns HTTP 429 when the limit is exceeded
 *
 */
export const rateLimitTrack = rateLimit({
  windowMs: 60_000,
  limit: 10,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) =>
    req.ip ?? req.socket.remoteAddress ?? "unknown",

  handler: (_req: Request, res: Response) => {
    return res.status(429).json(
      buildResponse(
        429,
        "Too many tracking requests. Please try again later.",
        null,
        {
          code: "RATE_LIMITED",
        },
      ),
    );
  },
});
