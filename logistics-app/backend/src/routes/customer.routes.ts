import { createCustomer } from "@/controllers/customer.controllers";
import { Router } from "express";

const router = Router();

router.post("/", createCustomer);

export default router;
