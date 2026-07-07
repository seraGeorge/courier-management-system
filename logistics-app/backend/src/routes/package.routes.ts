import {
  listLoadedPackages,
  listPackages,
} from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.get("/loaded", listLoadedPackages);

export default router;
