import { Router } from "express";
import { addPackage, listPackages, patchPackageStatus } from "../controllers/package.controller.js";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);
router.patch("/:id/status", patchPackageStatus);

export default router;
