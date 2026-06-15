import { addTruck, getArrivedTruckDetails, getTruckDetails, listLatestArrivalPackages, listTrucks, loadBag } from "@/controllers/truck.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addTruck);
router.get("/", listTrucks);
router.post("/load-bag", loadBag);
router.get("/:truckNumber", getTruckDetails);
router.post("/arrive", getArrivedTruckDetails);
router.get("/latest-arrival", listLatestArrivalPackages);

export default router;
