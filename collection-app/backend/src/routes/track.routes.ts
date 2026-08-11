import { track } from "@/controllers/track.controller";
import { rateLimitTrack } from "@/middlewares/rateLimitTrack";
import { Router } from "express";

const router = Router();

router.post("/", rateLimitTrack, track);

export default router;
