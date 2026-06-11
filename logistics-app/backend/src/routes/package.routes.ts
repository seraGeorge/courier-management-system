import { addPackage, listPackages } from "@/controllers/package.controllers";
import { Router } from "express";

const router = Router();

router.get("/", listPackages);
router.post("/", addPackage);

export default router;
