import { generateSignature } from "@/utils/hmac";
import { getNextRetryTime } from "@/utils/retry";
import { CreatePackageInput } from "@/validations/package";
import { prisma } from "@/lib/prisma";
import { SyncStatus } from "@/generated/prisma/client";
import axios from "axios";

const MAX_ATTEMPTS = 10;
export const PACKAGE_CREATED_EVENT = "PACKAGE_CREATED";

export type PackageCreatedPayload = CreatePackageInput & { trackingId: string };

const getWebhookUrl = () => {
  const rawApiUrl = process.env.API_URL?.trim();
  if (!rawApiUrl) {
    throw new Error("API_URL is not configured");
  }

  const baseUrl = rawApiUrl.replace(/\/+$/, "");
  return baseUrl.endsWith("/api")
    ? `${baseUrl}/webhooks/packages`
    : `${baseUrl}/api/webhooks/packages`;
};

export const deliverPackageCreatedWebhook = async (
  payload: PackageCreatedPayload,
) => {
  const secretKey = process.env.LOGISTICS_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("LOGISTICS_SECRET_KEY is not configured");
  }

  const body = JSON.stringify(payload);
  const signature = generateSignature(body, secretKey);

  await axios.post(getWebhookUrl(), payload, {
    headers: {
      "x-api-key": process.env.LOGISTICS_API_KEY?.trim(),
      "x-signature": signature,
    },
  });
};

const isRetryableError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return true;
  if (!error.response) return true;

  const status = error.response.status;
  return status >= 500 || status === 401;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
  }

  if (error instanceof Error) return error.message;
  return "Unknown error";
};

export const processOutboundWebhooks = async () => {
  const pending = await prisma.outboundWebhook.findMany({
    where: {
      deliveredAt: null,
      nextRetryAt: { lte: new Date() },
    },
    orderBy: { nextRetryAt: "asc" },
    take: 50,
  });

  if (pending.length > 0) {
    console.log(`[Outbox] Delivering ${pending.length} webhook(s)`);
  }

  for (const event of pending) {
    const payload = event.payload as PackageCreatedPayload;

    try {
      await deliverPackageCreatedWebhook(payload);

      await prisma.$transaction([
        prisma.outboundWebhook.update({
          where: { id: event.id },
          data: { deliveredAt: new Date(), lastError: null },
        }),
        prisma.package.update({
          where: { trackingId: event.trackingId },
          data: { syncStatus: SyncStatus.SYNCED, syncedAt: new Date() },
        }),
      ]);
    } catch (error) {
      const nextAttempts = event.attempts + 1;
      const errorMessage = getErrorMessage(error);

      console.error(
        `[Outbox] Failed to deliver webhook ${event.id} (attempt ${nextAttempts})`,
        errorMessage,
      );

      if (!isRetryableError(error) || nextAttempts >= MAX_ATTEMPTS) {
        await prisma.$transaction([
          prisma.outboundWebhook.update({
            where: { id: event.id },
            data: {
              attempts: nextAttempts,
              lastError: errorMessage,
            },
          }),
          prisma.package.update({
            where: { trackingId: event.trackingId },
            data: { syncStatus: SyncStatus.FAILED },
          }),
        ]);
        continue;
      }

      await prisma.outboundWebhook.update({
        where: { id: event.id },
        data: {
          attempts: nextAttempts,
          nextRetryAt: getNextRetryTime(nextAttempts),
          lastError: errorMessage,
        },
      });
    }
  }
};
