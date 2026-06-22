import { Router } from "express";
import packageRoutes from "./package.routes";

const webhookRoutes = Router();


webhookRoutes.use("/packages", packageRoutes);

export default webhookRoutes;
