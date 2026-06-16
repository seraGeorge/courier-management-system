import { TruckStatus } from "@/generated/prisma/browser";
import { z } from "zod";

export const LoadBagToTruck = z.object({
  truckNumber: z.string().min(1),
  bagNumber: z.string().min(1),
});

export const UpdateTruckStatusSchema = z.object({
  status: z.enum([TruckStatus.DEPARTED, TruckStatus.ARRIVED, TruckStatus.DELAYED]),
});

export type UpdateTruckStatusRequest = z.infer<typeof UpdateTruckStatusSchema>;