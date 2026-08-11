import {
  listPackages,
  addPackage,
  patchPackageStatus,
} from "@/controllers/package.controller";
import { receiveRawUpdates } from "@/controllers/rawPackageUpdates.controller";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { verifyWebhook } from "@/middlewares/verifyWebhook";
import { Router } from "express";

const router = Router();

router.get("/", verifyStaffAuth, listPackages);
router.post("/", verifyStaffAuth, addPackage);
router.patch("/:id/status", verifyStaffAuth, patchPackageStatus);
router.post("/raw-package-updates", verifyWebhook, receiveRawUpdates);

export default router;
