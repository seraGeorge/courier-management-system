import { Router } from "express";
import packageRoutes from "./package.routes";
import bagRoutes from "./bag.routes";
import truckRoutes from "./truck.routes";
import regionRoutes from "./region.routes";
import webhookRoutes from "./webhooks";
import customerRoutes from "./customer.routes";
import healthRoutes from "./health.routes";
import etlRoutes from "./etl.routes";

const router = Router();

router.use("/health",healthRoutes);

router.use("/regions", regionRoutes);

router.use("/packages", packageRoutes);

router.use("/bags", bagRoutes);

router.use("/trucks", truckRoutes);

router.use("/customers", customerRoutes);

router.use("/webhooks",webhookRoutes);

router.use("/etl", etlRoutes);
export default router;
