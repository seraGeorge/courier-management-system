import { receivePackageWebhook } from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();
router.post("/", receivePackageWebhook);

export default router;
