import {
  addTruck,
  getArrivedTruckDetails,
  getTruckDetails,
  listTrucks,
  loadBag,
  updateTruckStatusController,
} from "@/controllers/truck.controllers";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { Router } from "express";

const router = Router();

router.post("/", verifyStaffAuth, addTruck);
router.get("/", verifyStaffAuth, listTrucks);
router.post("/load-bag", verifyStaffAuth, loadBag);
router.post("/arrive", verifyStaffAuth, getArrivedTruckDetails);
router.get("/:truckNumber", verifyStaffAuth, getTruckDetails);
router.patch("/:truckNumber/status", verifyStaffAuth, updateTruckStatusController);

export default router;
