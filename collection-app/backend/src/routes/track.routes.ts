import { track } from "@/controllers/track.controller.js";
import { Router } from "express";

const router = Router();

router.post("/", track);

export default router;
