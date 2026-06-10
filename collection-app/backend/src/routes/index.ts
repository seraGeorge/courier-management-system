import { Router } from "express";
import dashboardRoutes from "./dashboard.routes";
import packageRoutes from "./package.routes";
import trackRoutes from "./track.routes";

const router = Router();

router.use("/packages", packageRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/track", trackRoutes);

export default router;
