import { listPackages, addPackage, patchPackageStatus } from "@/controllers/package.controller";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.patch("/:id/status", patchPackageStatus);

export default router;
