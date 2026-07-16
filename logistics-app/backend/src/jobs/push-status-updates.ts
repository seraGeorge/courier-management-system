import axios from "axios";
import cron from "node-cron";
import { runEtlPushForCustomer } from "@/services/package-status-history.service";
import {
  disableCustomer,
  getActiveCustomers,
  incrementFailureCount,
  resetFailureCount,
} from "@/services/customer.service";
const isAuthWebhookError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

const isRetryableWebhookError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true;
  return error.response.status >= 500;
};

const isNonRetryableWebhookError = (error: unknown) =>
  axios.isAxiosError(error) &&
  error.response !== undefined &&
  error.response.status >= 400 &&
  error.response.status < 500 &&
  error.response.status !== 401;

const getAxiosResponseDetails = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  return { status: error.response?.status, data: error.response?.data };
};

let isRunning = false;

cron.schedule("* * * * *", async () => {
  if (isRunning) {
    console.warn("[ETL] Previous run still in progress, skipping this tick");
    return;
  }
  isRunning = true;

  try {
    const customers = await getActiveCustomers();

    for (const customer of customers) {
      try {
        await runEtlPushForCustomer(customer);
        await resetFailureCount(customer.id);
      } catch (error) {
        console.error(
          `[ETL] Failed to process updates for customer ${customer.id}`,
          error,
        );
        
        if (isAuthWebhookError(error)) {
          console.warn(
            `[ETL] Auth rejected for customer ${customer.id} — likely a secretKey mismatch.`,
          );
          const updatedCustomer = await incrementFailureCount(customer.id);
          if (updatedCustomer.failureCount >= 5) {
            await disableCustomer(updatedCustomer.id);
          }
          continue;
        }

        if (isNonRetryableWebhookError(error)) {
          const response = getAxiosResponseDetails(error);
          console.warn(
            `[ETL] Collection webhook rejected updates for customer ${customer.id} with status ${response?.status}. Fix the payload or customer configuration before retrying.`,
            response?.data,
          );
          continue;
        }

        if (!isRetryableWebhookError(error)) {
          // e.g. missing webhookUrl/apiKey/secretKey — a config error, not transient.
          // Won't fix itself on retry, so treat it like a hard failure too.
          const updatedCustomer = await incrementFailureCount(customer.id);
          if (updatedCustomer.failureCount >= 5) {
            await disableCustomer(updatedCustomer.id);
          }
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
  } finally {
    isRunning = false;
  }
});
