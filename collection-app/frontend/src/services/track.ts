import API from "./api";
import type { TrackResult } from "@/types/track";

export type TrackInput = {
  trackingId: string;
  captchaToken: string;
};

export const trackPackage = async (data: TrackInput) => {
  return API.post<TrackResult, TrackInput>("/track", data, {
    requiresAuth: false,
  });
};
