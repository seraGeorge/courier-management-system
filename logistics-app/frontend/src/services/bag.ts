import { api } from "./api";

export const getBags = async () => {
  const response = await api.get("/bags");

  return response.data;
};

export const sealBag = async (bagNumber: string) => {
  const response = await api.post("/bags/seal", {
    bagNumber,
  });

  return response.data;
};

export const createBag = async () => {
  const response = await api.post("/bags");

  return response.data;
}