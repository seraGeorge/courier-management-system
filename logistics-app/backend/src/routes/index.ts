import { Router } from "express";
import packageRoutes from "./package.routes";
import bagRoutes from "./bag.routes";
import truckRoutes from "./truck.routes";
import regionRoutes from "./region.routes";
import webhookRoutes from "./webhooks";

const router = Router();

router.use("/regions", regionRoutes);

router.use("/packages", packageRoutes);

router.use("/bags", bagRoutes);

router.use("/trucks", truckRoutes);

router.use("/webhooks",webhookRoutes);

export default router;
