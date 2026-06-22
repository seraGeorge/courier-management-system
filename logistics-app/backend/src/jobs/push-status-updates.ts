import cron from "node-cron";
import axios from "axios";
import { getUpdatedPackages } from "@/services/package-status-history.service";

cron.schedule("* * * * *", async () => {
  try {
    console.log("Pushing updates...");

    const updates = await getUpdatedPackages();

    if (updates.length === 0) {
      return;
    }

    await axios.post(process.env.COLLECTION_RAW_UPDATE_URL!, updates);

    console.log(`Pushed ${updates.length} updates`);
  } catch (error) {
    console.error("Failed to push updates", error);
  }
});
