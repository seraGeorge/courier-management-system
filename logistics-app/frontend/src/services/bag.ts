import { api } from "./api";

export const getBags = async () => {
  const response = await api.get("/bags");

  return response.data;
};
