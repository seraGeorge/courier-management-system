import { z } from "zod";

export const TrackPackageSchema = z.object({
  trackingId: z
    .string({ error: "Tracking ID is required." })
    .trim()
    .min(1, "Enter a tracking ID to look up your package."),
  captchaToken: z.string().min(1, "Captcha token is required"),
});