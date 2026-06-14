import { addBag, addPackageToBag, delayBag, getBagDetails, listBags, sealBag } from "@/controllers/bag.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addBag);
router.post("/assign", addPackageToBag)
router.get("/", listBags);
router.get("/:bagNumber", getBagDetails);
router.post("/seal", sealBag);
router.post("/delay", delayBag);

export default router;
