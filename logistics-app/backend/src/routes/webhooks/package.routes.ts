import { receivePackageWebhook } from "@/controllers/package.controllers";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();
router.post("/webhook", verifyWebhook, receivePackageWebhook);
export default router;
