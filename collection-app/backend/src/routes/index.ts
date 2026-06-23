import { Router } from "express";
import dashboardRoutes from "./dashboard.routes";
import packageRoutes from "./package.routes";
import trackRoutes from "./track.routes";
import regionRoutes from "./region.routes";
import rawPackageUpdatesRoutes from "./rawPackageUpdate.routes";
const router = Router();

router.use("/packages", packageRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/track", trackRoutes);
router.use("/regions", regionRoutes);
router.use("/raw-updates", rawPackageUpdatesRoutes);
export default router;
