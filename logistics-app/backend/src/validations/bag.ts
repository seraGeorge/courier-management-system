import { z } from "zod";

export const CreateBagSchema = z.object({
  bagNumber: z.string().min(1),
});

export const AssignPackageToBagSchema = z.object({
  trackingId: z.string().min(1),
  bagNumber: z.string().min(1),
});