import {
  listLoadedPackages,
  listPackages,
  patchPackageStatus,
} from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.get("/loaded", listLoadedPackages);
router.patch("/:id/status", patchPackageStatus);

export default router;
