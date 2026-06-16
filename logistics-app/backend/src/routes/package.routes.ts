import { addPackage, listLoadedPackages, listPackages, updatePackageStatus } from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.get("/loaded", listLoadedPackages);
router.patch("/:trackingId/status", updatePackageStatus);

export default router;
