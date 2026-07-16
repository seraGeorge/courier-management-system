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
        console.error(
          `[ETL] Package not found for trackingId ${update.trackingId} (eventId ${update.eventId}) — skipping row, not the whole batch.`,
        );
        // Decide: mark appliedAt now to stop retrying a row that'll never resolve,
        // or leave null to keep retrying in case the package arrives later via webhook.
        // Leaving null assumes eventual consistency; if you're confident this can't
        // self-heal, mark it applied here so it doesn't loop forever.
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

      await axios.post(
        `${process.env.LOGISTICS_BASE_URL}/api/etl/confirm`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.COLLECTION_API_KEY!,
            "x-signature": generateSignature(
              payload,
              process.env.COLLECTION_SECRET_KEY!,
            ),
          },
        },
      );

      await prisma.rawPackageUpdate.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { confirmedAt: new Date() },
      });
    } catch (err) {
      console.error(`[ETL] Failed to confirm batch ${batchId}`, err);
    }
  }
};
