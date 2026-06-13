import { Router } from "express";
import packageRoutes from "./package.routes";
import bagRoutes from "./bag.routes";
import truckRoutes from "./truck.routes";

const router = Router();

router.use("/packages", packageRoutes);

router.use("/bags", bagRoutes);

router.use("/trucks", truckRoutes);

export default router;
