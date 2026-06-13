import { addBag, addPackageToBag, getBagDetails, listBags } from "@/controllers/bag.controllers";
import { Router } from "express";

const router = Router();

router.post("/", addBag);
router.post("/assign", addPackageToBag)
router.get("/", listBags);
router.get("/:bagNumber", getBagDetails);

export default router;
