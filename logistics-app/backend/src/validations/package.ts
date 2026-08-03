import { PackageStatus } from "@/generated/prisma/browser";
import { z } from "zod";

export const CreatePackageSchema = z.object({
  senderName: z.string().min(1),
  receiverName: z.string().min(1),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  weight: z.number().positive(),
  regionCode: z.string().min(1),
  trackingId: z.string(),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;

export const UpdatePackageStatusSchema = z
  .object({
    status: z.enum(PackageStatus),
    delayReason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.status !== PackageStatus.DELAYED ||
      (data.delayReason && data.delayReason.trim().length > 0),
    {
      message: "Delay reason is required when status is DELAYED",
      path: ["delayReason"],
    },
  );

/** Inbound status update from Collection (collection-facing status names). */
export const CollectionPackageStatusUpdateSchema = z
  .object({
    trackingId: z.string().min(1),
    status: z.enum([
      "TO_BE_PICKED_UP",
      "PICKED_UP",
      "SCHEDULED_FOR_DELIVERY",
      "OUT_FOR_DELIVERY",
      "DELAYED",
      "DELIVERED",
    ]),
    delayReason: z.string().optional().nullable(),
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

export type CollectionPackageStatusUpdateInput = z.infer<
  typeof CollectionPackageStatusUpdateSchema
>;
