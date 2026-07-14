import { receivePackageWebhook } from "@/controllers/package.controllers";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();
router.post("/", verifyWebhook, receivePackageWebhook);
export default router;
