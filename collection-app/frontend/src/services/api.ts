import AppEnv from "@/config/env";
import FetchApi from "./fetch";

const API = new FetchApi({
  baseUrl: AppEnv.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
