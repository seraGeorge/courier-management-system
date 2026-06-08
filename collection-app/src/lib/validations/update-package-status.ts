import { PackageStatus } from "@/generated/prisma/enums";
import { z } from "zod";

export const UpdatePackageStatusSchema = z
  .object({
    status: z.enum(PackageStatus),
    delayReason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.status !== "DELAYED" ||
      (data.delayReason && data.delayReason.trim().length > 0),
    {
      message: "Delay reason is required when status is DELAYED",
      path: ["delayReason"],
    },
  );
