import { createCustomer } from "@/controllers/customer.controllers";
import { verifyStaffAuth } from "@/middlewares/verifyStaffAuth";
import { Router } from "express";

const router = Router();

router.post("/", verifyStaffAuth, createCustomer);

export default router;
