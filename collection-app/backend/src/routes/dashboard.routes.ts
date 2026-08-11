import { getDashboard } from "@/controllers/dashboard.controller";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { Router } from "express";

const router = Router();

router.get("/", verifyStaffAuth, getDashboard);

export default router;
