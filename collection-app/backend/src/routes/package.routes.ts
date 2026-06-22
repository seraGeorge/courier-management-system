import { listPackages, addPackage, patchPackageStatus, receiveRawUpdates } from "@/controllers/package.controller";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.patch("/:id/status", patchPackageStatus);
router.post("/raw-package-updates", receiveRawUpdates);

export default router;
