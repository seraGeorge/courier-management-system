import { processRawUpdates } from "@/services/package.service";
import cron from "node-cron";

cron.schedule("* * * * *", async () => {
  console.log("Processing raw updates...");
  await processRawUpdates();
});
