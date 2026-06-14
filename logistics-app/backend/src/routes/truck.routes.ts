import { addTruck, getArrivedTruckDetails, getTruckDetails, listTrucks, loadBag } from "@/controllers/truck.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addTruck);
router.get("/", listTrucks);
router.post("/load-bag", loadBag);
router.get("/:truckNumber", getTruckDetails);
router.post("/arrive", getArrivedTruckDetails);

export default router;
