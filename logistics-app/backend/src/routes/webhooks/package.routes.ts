import {
  receivePackageStatusWebhook,
  receivePackageWebhook,
} from "@/controllers/package.controllers";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();
router.post("/", verifyWebhook, receivePackageWebhook);
router.post("/status", verifyWebhook, receivePackageStatusWebhook);
export default router;
