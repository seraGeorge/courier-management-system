import { addPackage, listLatestArrivalPackages, listLoadedPackages, listPackages, updatePackageStatus } from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.patch("/:trackingId/status", updatePackageStatus);
router.get("/latest-arrival", listLatestArrivalPackages);
router.get("/loaded", listLoadedPackages);

export default router;
