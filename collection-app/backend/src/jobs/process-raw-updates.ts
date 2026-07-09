import { processRawUpdates } from "@/services/package.service";
import cron from "node-cron";

let isRunning = false;

cron.schedule("*/5 * * * * *", async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    await processRawUpdates();
  } finally {
    isRunning = false;
  }
});
