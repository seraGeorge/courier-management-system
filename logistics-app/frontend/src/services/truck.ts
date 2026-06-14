import { api } from "./api";

export const getTrucks = async () => {
  const response = await api.get("/trucks");

  return response.data;
};
