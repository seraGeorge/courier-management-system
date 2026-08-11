import { getRegions } from "@/controllers/region.controller";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { Router } from "express";

const router = Router();

router.get("/", verifyStaffAuth, getRegions);

export default router;
