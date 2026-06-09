import { getDashboard } from "@/controllers/dashboard.controller.js";
import { Router } from "express";

const router = Router();

router.get("/", getDashboard);

export default router;
