import { receiveRawUpdates } from "@/controllers/package.controller";
import { Router } from "express";

const router = Router();
router.post("/", receiveRawUpdates);

export default router;
