import { Router } from "express";
import packageRoutes from "./package.routes";
import bagRoutes from "./bag.routes";
import truckRoutes from "./truck.routes";
import regionRoutes from "./region.routes";
import webhookRoutes from "./webhooks";
import { getUpdatedPackages, pushUpdatesToCollection } from "@/services/package-status-history.service";

const router = Router();

router.use("/regions", regionRoutes);

router.use("/packages", packageRoutes);

router.use("/bags", bagRoutes);

router.use("/trucks", truckRoutes);

router.use("/webhooks",webhookRoutes);

router.post("/test/push-updates", async (req, res) => {
  try {
    await pushUpdatesToCollection();

    return res.status(200).json({
      message: "Updates pushed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to push updates",
    });
  }
});
export default router;
