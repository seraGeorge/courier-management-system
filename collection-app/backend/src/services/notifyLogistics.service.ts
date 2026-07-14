import { generateSignature } from "@/utils/hmac";
import { CreatePackageInput } from "@/validations/package";
import axios from "axios";

export const createPackageWebhook = async (
  payload: CreatePackageInput & { trackingId: string },
) => {
  const rawApiUrl = process.env.API_URL;
  if (!rawApiUrl) {
    throw new Error("API_URL is not configured");
  }

  const baseUrl = rawApiUrl.replace(/\/+$/, "");
  const webhookUrl = baseUrl.endsWith("/api")
    ? `${baseUrl}/webhooks/packages`
    : `${baseUrl}/api/webhooks/packages`;

  const body = JSON.stringify(payload);
  const signature = generateSignature(body, process.env.LOGISTICS_SECRET_KEY!);

  try {
    await axios.post(webhookUrl, payload, {
      headers: {
        "x-api-key": process.env.LOGISTICS_API_KEY,
        "x-signature": signature,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};
