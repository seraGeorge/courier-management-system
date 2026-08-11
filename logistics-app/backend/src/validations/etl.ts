// src/validations/etl.ts
import { z } from "zod";

export const EtlConfirmSchema = z.object({
  batchId: z.string().min(1, "batchId is required"),
  confirmations: z
    .array(
      z.object({
        eventId: z.string().min(1, "eventId is required"),
        trackingId: z.string().min(1, "trackingId is required"),
        status: z.string().min(1, "status is required"),
      }),
    )
    .min(1, "confirmations must contain at least one entry"),
});
