import { addPackage, listPackages, updatePackageStatus } from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.patch("/:trackingId/status", updatePackageStatus);

export default router;
