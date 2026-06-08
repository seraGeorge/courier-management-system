import { z } from "zod";

export const TrackPackageSchema = z.object({
  trackingId: z.string().uuid(),
  captcha: z.string().min(1, "Captcha is required"),
});