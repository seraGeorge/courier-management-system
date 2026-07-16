import { Router } from "express";
import { receiveRawUpdates } from "@/controllers/rawPackageUpdates.controller";

const router = Router();
router.post("/", receiveRawUpdates);

export default router;
