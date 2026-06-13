import { Router } from "express";
import packageRoutes from "./package.routes";
import bagRoutes from "./bag.routes";

const router = Router();

router.use("/packages", packageRoutes);

router.use("/bags", bagRoutes);

export default router;
