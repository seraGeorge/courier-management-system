import cron from "node-cron";
import axios from "axios";
import { getUpdatedPackages, pushUpdatesToCollection } from "@/services/package-status-history.service";

cron.schedule("* * * * *", async () => {
  try {
    console.log("Pushing updates...");

    await pushUpdatesToCollection();

  } catch (error) {
    console.error("Failed to push updates", error);
  }
});
