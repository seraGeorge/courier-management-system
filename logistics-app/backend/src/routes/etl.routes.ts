// routes/etl.route.ts

import { confirmPackageUpdates } from "@/controllers/etl.controllers";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();

router.post("/confirm", verifyWebhook, confirmPackageUpdates);

export default router;
