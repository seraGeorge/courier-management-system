import { addBag, addPackageToBag, completeBag, delayBag, getBagDetails, listBags, sealBag } from "@/controllers/bag.controllers";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { Router } from "express";

const router = Router();

router.post("/", verifyStaffAuth, addBag);
router.post("/assign", verifyStaffAuth, addPackageToBag);
router.get("/", verifyStaffAuth, listBags);
router.get("/:bagNumber", verifyStaffAuth, getBagDetails);
router.post("/seal", verifyStaffAuth, sealBag);
router.post("/delay", verifyStaffAuth, delayBag);
router.patch("/:bagNumber/complete", verifyStaffAuth, completeBag);

export default router;
