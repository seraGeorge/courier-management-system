import { api } from "./api";

export const getPackages = async () => {
  const response = await api.get("/packages");

  return response.data;
};
