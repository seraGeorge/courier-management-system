import { addTruck, getTruckDetails, listTrucks, loadBag } from "@/controllers/truck.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addTruck);
router.get("/", listTrucks);
router.post("/load-bag", loadBag);
router.get("/:truckNumber", getTruckDetails);

export default router;
