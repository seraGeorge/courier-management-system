import { addPackage } from "@/cotnrollers/package.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addPackage);

export default router;
