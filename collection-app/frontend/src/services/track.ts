import API from "./api";
import type { TrackResult } from "@/types/track";

export type TrackInput = {
  trackingId: string;
  captchaVerified: 0 | 1;
};

export const trackPackage = async (data: TrackInput) => {
  return API.post<TrackResult, TrackInput>("/track", data);
};
