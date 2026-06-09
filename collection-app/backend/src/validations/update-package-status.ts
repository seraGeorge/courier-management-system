import { z } from "zod";

export const UpdatePackageStatusSchema = z
  .object({
    status: z.coerce.number().int().min(0).max(4),
    delayReason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.status !== 3 ||
      (data.delayReason && data.delayReason.trim().length > 0),
    {
      message: "Delay reason is required when status is DELAYED",
      path: ["delayReason"],
    },
  );
