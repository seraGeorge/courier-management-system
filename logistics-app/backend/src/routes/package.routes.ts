import {
  listLoadedPackages,
  listPackages,
  patchPackageStatus,
} from "@/controllers/package.controllers";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { Router } from "express";

const router = Router();

router.get("/", verifyStaffAuth, listPackages);
router.get("/loaded", verifyStaffAuth, listLoadedPackages);
router.patch("/:id/status", verifyStaffAuth, patchPackageStatus);

export default router;
