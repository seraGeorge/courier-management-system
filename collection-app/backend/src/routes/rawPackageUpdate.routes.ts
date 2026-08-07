import { Router } from "express";
import { receiveRawUpdates } from "@/controllers/rawPackageUpdates.controller";
import { verifyWebhook } from "@/middlewares/verifyWebhook";

const router = Router();
router.post("/", verifyWebhook, receiveRawUpdates);

export default router;
