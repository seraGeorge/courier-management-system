// routes/etl.route.ts

import { confirmPackageUpdates } from "@/controllers/etl.controllers";
import { rateLimitWebhook } from "@/middlewares/rateLimitWebhook";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();

/**
 * Rate limiting is intentionally applied before webhook authentication.
 *
 * This prevents unauthenticated/garbage requests from repeatedly reaching
 * the more expensive authentication and signature-verification logic.
 *
 * The rate limiter uses the `x-api-key` value as the bucket identifier.
 * Even though the key is not verified yet, legitimate customers will
 * consistently use their own API key and therefore get an isolated bucket.
 *
 * If authentication ran first, an attacker could bypass the rate limiter
 * simply by sending invalid credentials and force the server to perform
 * authentication work for every request.
 */

router.post("/confirm", rateLimitWebhook, verifyWebhook, confirmPackageUpdates);

export default router;
