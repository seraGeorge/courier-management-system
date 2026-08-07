import {
  listPackages,
  addPackage,
  patchPackageStatus,
} from "@/controllers/package.controller";
import { receiveRawUpdates } from "@/controllers/rawPackageUpdates.controller";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.patch("/:id/status", patchPackageStatus);
router.post("/raw-package-updates", verifyWebhook, receiveRawUpdates);

export default router;
