import { PackageStatus } from "@/generated/prisma/enums";
import { z } from "zod";

export const RawPackageUpdatesSchema = z.object({
  batchId: z.string().min(1),
  updates: z
    .array(
      z.object({
        eventId: z.string().min(1),
        trackingId: z.string().min(1),
        status: z.nativeEnum(PackageStatus),
        occurredAt: z.string().datetime().optional(),
        delayReason: z.string().nullable().optional(),
      }),
    )
    .min(1),
});
