import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: z.email(),
  webhookUrl: z
    .url()
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Webhook URL must use HTTP or HTTPS",
    }),
});
