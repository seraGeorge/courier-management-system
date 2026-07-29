import cron from "node-cron";
import { processOutboundWebhooks } from "@/services/notifyLogistics.service";

let isRunning = false;

export const startOutboundWebhookProcessorJob = () => {
  cron.schedule("*/5 * * * * *", async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await processOutboundWebhooks();
    } finally {
      isRunning = false;
    }
  });
};
