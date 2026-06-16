import { api } from "./api";

export const getTrucks = async (status?: string[]) => {
  const response = await api.get("/trucks", {
    params: {
      status: status?.join(","),
    },
  });
  return response.data;
};

export const createTruck = async () => {
  const response = await api.post("/trucks");
  return response.data;
};

export const loadBagToTruck = async (
  bagNumber: string,
  truckNumber: string,
) => {
  const response = await api.post("/trucks/load-bag", {
    bagNumber,
    truckNumber,
  });

  return response.data;
};



export const updateTruckStatus = async (
  truckNumber: string,
  status: "DEPARTED" | "ARRIVED" | "DELAYED",
) => {
  const response = await api.patch(`/trucks/${truckNumber}/status`, {
    status,
  });

  return response.data;
};
