import { addTruck, getArrivedTruckDetails, getTruckDetails, listLatestArrivalPackages, listLoadedPackages, listTrucks, loadBag } from "@/controllers/truck.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addTruck);
router.get("/", listTrucks);
router.post("/load-bag", loadBag);
router.get("/:truckNumber", getTruckDetails);
router.post("/arrive", getArrivedTruckDetails);
router.get("/latest-arrival", listLatestArrivalPackages);
router.get("/loaded", listLoadedPackages);

export default router;
