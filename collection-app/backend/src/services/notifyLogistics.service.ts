import { generateSignature } from "@/utils/hmac";
import { CreatePackageInput } from "@/validations/package";
import axios from "axios";

export const createPackageWebhook = async (
  payload: CreatePackageInput & { trackingId: string },
) => {
  const body = JSON.stringify(payload);
  const signature = generateSignature(body, process.env.LOGISTICS_SECRET_KEY!);

  try {
    await axios.post(`${process.env.API_URL}/webhooks/packages`, payload, {
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
