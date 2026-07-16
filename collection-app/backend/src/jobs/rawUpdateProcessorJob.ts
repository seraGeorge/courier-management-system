// jobs/rawUpdateProcessorJob.ts — wire it explicitly, per the earlier decision (no side-effect imports)
import cron from "node-cron";
import { processRawUpdates } from "@/services/package.service";

let isRunning = false;

export const startRawUpdateProcessorJob = () => {
  cron.schedule("*/5 * * * * *", async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await processRawUpdates();
    } finally {
      isRunning = false;
    }
  });
};
