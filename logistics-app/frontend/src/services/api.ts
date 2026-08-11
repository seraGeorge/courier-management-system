import axios from "axios";
import { getStaffAuthHeaders } from "@/utils/staffAuth";

console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  let body = "";

  if (config.data !== undefined) {
    body =
      typeof config.data === "string"
        ? config.data
        : JSON.stringify(config.data);
    config.data = body;
  }

  const authHeaders = await getStaffAuthHeaders(body);
  config.headers.set("Content-Type", "application/json");
  config.headers.set("x-api-key", authHeaders["x-api-key"]);
  config.headers.set("x-signature", authHeaders["x-signature"]);

  return config;
});
