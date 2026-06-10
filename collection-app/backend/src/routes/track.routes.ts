import { track } from "@/controllers/track.controller";
import { Router } from "express";

const router = Router();

router.post("/", track);

export default router;
