import cron from "node-cron";
import {
  sendPackageUpdatesToCollection,
  markUpdatesProcessed,
  getPendingUpdates,
} from "@/services/package-status-history.service";
import {
  disableCustomer,
  getActiveCustomers,
  incrementFailureCount,
  resetFailureCount,
} from "@/services/customer.service";

cron.schedule("* * * * *", async () => {
  try {
    const customers = await getActiveCustomers();
    for (const customer of customers) {
      try {
        const updates = await getPendingUpdates(customer.id);

        if (updates.length === 0) {
          continue;
        }
        console.log(
          `[ETL] Sending ${updates.length} update(s) for customer ${customer.id}`,
        );

        await sendPackageUpdatesToCollection(customer, updates);

        await markUpdatesProcessed(updates.map((u) => u.eventId));

        await resetFailureCount(customer.id);
      } catch (error) {
        console.error(
          `[ETL] Failed to process updates for customer ${customer.id}`,
          error,
        );
        const updatedCustomer = await incrementFailureCount(customer.id);
        if (updatedCustomer.failureCount  >= 5) {
          await disableCustomer(updatedCustomer.id);
        }
      }
    }
  } catch (error) {
    console.error("Failed to push updates", error);
  }
});
