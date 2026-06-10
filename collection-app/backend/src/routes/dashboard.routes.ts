import { getDashboard } from "@/controllers/dashboard.controller";
import { Router } from "express";

const router = Router();

router.get("/", getDashboard);

export default router;
