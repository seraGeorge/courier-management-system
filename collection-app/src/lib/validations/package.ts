import { PackageStatus } from "@/generated/prisma/browser";
import { z } from "zod";

export const CreatePackageSchema = z.object({
  senderName: z.string().min(1),
  receiverName: z.string().min(1),
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  weight: z.number().positive(),
  region: z.string().min(1),
  status: z.enum(PackageStatus).optional(),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;
