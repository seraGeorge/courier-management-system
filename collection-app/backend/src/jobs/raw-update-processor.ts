import { prisma } from "@/lib/prisma";
import { generateSignature } from "@/utils/hmac";
import axios from "axios";

// jobs/rawUpdateProcessor.ts
export const processRawUpdates = async () => {
  const unapplied = await prisma.rawPackageUpdate.findMany({
    where: { appliedAt: null },
    orderBy: { receivedAt: "asc" },
    take: 200,
  });

  for (const update of unapplied) {
    try {
      const existing = await prisma.package.findUnique({
        where: { trackingId: update.trackingId },
      });

      if (!existing) {
        // Collection owns package creates; unknown trackingIds will not appear later.
        console.warn(
          `[ETL] Package not found for trackingId ${update.trackingId} (eventId ${update.eventId}) — marking applied and skipping.`,
        );
        await prisma.rawPackageUpdate.update({
          where: { id: update.id },
          data: { appliedAt: new Date() },
        });
        continue;
      }

      await prisma.$transaction([
        prisma.package.update({
          where: { trackingId: update.trackingId },
          data: { status: update.status },
        }),
        prisma.rawPackageUpdate.update({
          where: { id: update.id },
          data: { appliedAt: new Date() },
        }),
      ]);
    } catch (err) {
      console.error(`[ETL] Failed to apply update ${update.id}`, err);
      // appliedAt stays null — retried next tick
    }
  }

  // confirm anything applied but not yet confirmed, grouped by batch
  const unconfirmed = await prisma.rawPackageUpdate.findMany({
    where: { appliedAt: { not: null }, confirmedAt: null },
    orderBy: { receivedAt: "asc" },
  });

  const byBatch = new Map<string, typeof unconfirmed>();
  for (const u of unconfirmed) {
    if (!byBatch.has(u.batchId)) byBatch.set(u.batchId, []);
    byBatch.get(u.batchId)!.push(u);
  }

  for (const [batchId, rows] of byBatch) {
    try {
      const payload = JSON.stringify({
        batchId,
        confirmations: rows.map((r) => ({
          eventId: r.eventId,
          trackingId: r.trackingId,
          status: r.status,
        })),
      });
      console.log("API_URL =", process.env.API_URL);
      console.log("LOGISTICS_API_KEY =", process.env.LOGISTICS_API_KEY);
      console.log("LOGISTICS_SECRET_KEY =", process.env.LOGISTICS_SECRET_KEY);
      const secret = process.env.LOGISTICS_SECRET_KEY!;

      console.log("secret length:", secret?.length);
      console.log("secret value:", JSON.stringify(secret));
      const signature = generateSignature(payload, secret);
      await axios.post(`${process.env.API_URL}/etl/confirm`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.LOGISTICS_API_KEY!,
          "x-signature": signature,
        },
      });

      await prisma.rawPackageUpdate.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { confirmedAt: new Date() },
      });
    } catch (err) {
      console.error(`[ETL] Failed to confirm batch ${batchId}`, err);
    }
  }
};
