import { addTruck, listTrucks, loadBag } from "@/controllers/truck.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addTruck);
router.get("/", listTrucks);
router.post("/load-bag", loadBag);

export default router;
