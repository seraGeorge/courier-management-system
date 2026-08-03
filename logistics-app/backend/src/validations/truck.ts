import { TruckStatus } from "@/generated/prisma/browser";
import { z } from "zod";

export const LoadBagToTruck = z.object({
  truckNumber: z.string().min(1),
  bagNumber: z.string().min(1),
});

export const UpdateTruckStatusSchema = z
  .object({
    status: z.enum([
      TruckStatus.DEPARTED,
      TruckStatus.ARRIVED,
      TruckStatus.DELAYED,
    ]),
    delayReason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.status !== TruckStatus.DELAYED ||
      (data.delayReason && data.delayReason.trim().length > 0),
    {
      message: "Delay reason is required when status is DELAYED",
      path: ["delayReason"],
    },
  );

export type UpdateTruckStatusRequest = z.infer<typeof UpdateTruckStatusSchema>;
