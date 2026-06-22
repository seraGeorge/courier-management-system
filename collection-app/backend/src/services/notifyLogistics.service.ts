import { CreatePackageInput } from "@/validations/package";
import axios from "axios";

export const createPackageWebhook = async (payload: CreatePackageInput & { trackingId: string }) => {
  try {
    await axios.post(`${process.env.API_URL}/webhooks/packages`, payload);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
