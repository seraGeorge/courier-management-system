import { getRegions } from "@/controllers/region.controller";
import { Router } from "express";

const router = Router();

router.get("/", getRegions);

export default router;
