import { z } from "zod";

export const LoadBagToTruck = z.object({
  truckNumber: z.string().min(1),
  bagNumber: z.string().min(1),
});
