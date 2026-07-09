import cron from "node-cron";
import axios from "axios";
import {
  sendPackageUpdatesToCollection,
  markUpdatesProcessed,
  getPendingUpdates,
} from "@/services/package-status-history.service";

cron.schedule("* * * * *", async () => {
  try {
    const updates = await getPendingUpdates();

    if (updates.length === 0) {
      return;
    }
    console.log(`[ETL] Sending ${updates.length} update(s)`);

    await sendPackageUpdatesToCollection(updates);

    await markUpdatesProcessed(updates.map((u) => u.eventId));
  } catch (error) {
    console.error("Failed to push updates", error);
  }
});
