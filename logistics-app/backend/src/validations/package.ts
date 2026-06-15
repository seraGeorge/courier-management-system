import { PackageStatus } from "@/generated/prisma/browser";
import { z } from "zod";

export const CreatePackageSchema = z.object({
  senderName: z.string().min(1),
  receiverName: z.string().min(1),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  weight: z.number().positive(),
  regionCode: z.string().min(1),
  trackingId: z.string().min(1),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;

export const UpdatePackageStatusSchema = z.object({
  status: z.nativeEnum(PackageStatus),
});