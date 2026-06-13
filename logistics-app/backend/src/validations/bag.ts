import { z } from "zod";


export const AssignPackageToBagSchema = z.object({
  trackingId: z.string().min(1),
  bagNumber: z.string().min(1),
});

export const SealBagSchema = z.object({
  bagNumber: z.string().min(1),
});