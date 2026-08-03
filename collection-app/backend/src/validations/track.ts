import { z } from "zod";

export const TrackPackageSchema = z.object({
  trackingId: z
    .string({ error: "Tracking ID is required." })
    .trim()
    .min(1, "Enter a tracking ID to look up your package."),
  captchaVerified: z.union([z.literal(0), z.literal(1)], {
    error: "Captcha verification is required.",
  }),
});