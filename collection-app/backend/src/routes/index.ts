import { Router } from "express";
import packageRoutes from "./package.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import trackRoutes from "./track.routes.js";

const router = Router();

router.use("/packages", packageRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/track", trackRoutes);

export default router;
