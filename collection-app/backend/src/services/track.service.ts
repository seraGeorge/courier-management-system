import { prisma } from "@/lib/prisma";
import axios from "axios";

export const trackPackage = async (trackingId: string) => {
  const pkg = await prisma.package.findUnique({
    where: {
      trackingId,
    },
    select: {
      trackingId: true,
      status: true,
      delayReason: true,
      createdAt: true,
      region: {
        select: { code: true, name: true },
      },
      sale: {
        select: { amount: true, createdAt: true },
      },
    },
  });

  if (!pkg) return null;

  const history = await prisma.rawPackageUpdate.findMany({
    where: {
      trackingId,
      appliedAt: { not: null },
    },
    orderBy: { receivedAt: "asc" },
    select: {
      status: true,
      delayReason: true,
      receivedAt: true,
    },
  });

  return { ...pkg, history };
};


export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  console.log(process.env.RECAPTCHA_SECRET_KEY);
  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      },
    );
    console.log("[Recaptcha] response:", response.data); // temporary

    return response.data.success === true;
  } catch (err) {
    console.error("[Recaptcha] Verification request failed", err);
    return false;
  }
};