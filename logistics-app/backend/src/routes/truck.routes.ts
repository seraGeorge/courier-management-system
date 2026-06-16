import {
  addTruck,
  getArrivedTruckDetails,
  getTruckDetails,
  listTrucks,
  loadBag,
  updateTruckStatusController,
} from "@/controllers/truck.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addTruck);
router.get("/", listTrucks);
router.post("/load-bag", loadBag);
router.post("/arrive", getArrivedTruckDetails);
router.get("/:truckNumber", getTruckDetails);
router.patch("/:truckNumber/status", updateTruckStatusController);

export default router;
