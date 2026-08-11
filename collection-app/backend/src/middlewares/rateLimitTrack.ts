import { buildResponse } from "@/utils/response";
import { Request, Response, NextFunction } from "express";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const hits = new Map<string, { count: number; resetAt: number }>();

export const rateLimitTrack = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json(
      buildResponse(429, "Too many tracking requests. Please try again later.", null, {
        code: "RATE_LIMITED",
      }),
    );
  }

  entry.count += 1;
  next();
};
