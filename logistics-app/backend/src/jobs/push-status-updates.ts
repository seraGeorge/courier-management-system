import axios from "axios";
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

const isRetryableWebhookError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return error.response.status >= 500;
};

const isNonRetryableWebhookError = (error: unknown) =>
  axios.isAxiosError(error) &&
  error.response !== undefined &&
  error.response.status >= 400 &&
  error.response.status < 500;

const getAxiosResponseDetails = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  return {
    status: error.response?.status,
    data: error.response?.data,
  };
};

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

        if (isNonRetryableWebhookError(error)) {
          const response = getAxiosResponseDetails(error);
          console.warn(
            `[ETL] Collection webhook rejected updates for customer ${customer.id} with status ${response?.status}. Fix the payload or customer configuration before retrying.`,
            response?.data,
          );
          continue;
        }

        if (!isRetryableWebhookError(error)) {
          continue;
        }

        const updatedCustomer = await incrementFailureCount(customer.id);
        if (updatedCustomer.failureCount >= 5) {
          await disableCustomer(updatedCustomer.id);
        }
      }
    }
  } catch (error) {
    console.error("Failed to push updates", error);
  }
});
