import { z } from "zod";

export const TrackPackageSchema = z.object({
  trackingId: z.string().uuid(),
  captchaVerified: z.union([
    z.literal(0),
    z.literal(1),
  ]),
});