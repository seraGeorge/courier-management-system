import axios from "axios";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const setupDir = path.join(process.cwd(), "setup");
dotenv.config({ path: path.join(setupDir, ".env") });

const LOGISTICS_URL = process.env.LOGISTICS_URL?.trim();
const COLLECTION_WEBHOOK_URL = process.env.COLLECTION_WEBHOOK_URL?.trim();
const envPath = path.join(process.cwd(), "collection-app", "backend", ".env");

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy setup/.env.example to setup/.env and configure it.`,
    );
  }
  return value;
}

async function waitForBackend(logisticsUrl: string) {
  console.log(`Waiting for Logistics Backend at ${logisticsUrl}...`);

  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await axios.get(`${logisticsUrl}/health`, { timeout: 3000 });
      console.log("Logistics Backend is ready.");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error(
    "Timed out waiting for Logistics Backend. Start it with: cd logistics-app && docker compose up -d",
  );
}

async function registerCustomer(logisticsUrl: string, webhookUrl: string) {
  console.log("Registering Collection Application...");

  const { data } = await axios.post(`${logisticsUrl}/customers`, {
    name: "Collection App",
    email: "collection@example.com",
    webhookUrl,
  });

  return data.data;
}

function updateEnv(apiKey: string, secretKey: string) {
  let env = fs.readFileSync(envPath, "utf8");

  env = env.replace(
    /^LOGISTICS_API_KEY\s*=.*$/m,
    `LOGISTICS_API_KEY=${apiKey}`,
  );

  env = env.replace(
    /^LOGISTICS_SECRET_KEY\s*=.*$/m,
    `LOGISTICS_SECRET_KEY=${secretKey}`,
  );

  fs.writeFileSync(envPath, env);

  console.log("Updated Collection .env");
}

async function main() {
  try {
    const logisticsUrl = requireEnv("LOGISTICS_URL", LOGISTICS_URL);
    const webhookUrl = requireEnv(
      "COLLECTION_WEBHOOK_URL",
      COLLECTION_WEBHOOK_URL,
    );

    if (!fs.existsSync(envPath)) {
      throw new Error(
        `Missing ${envPath}. Create it before running setup (see README).`,
      );
    }

    await waitForBackend(logisticsUrl);

    const customer = await registerCustomer(logisticsUrl, webhookUrl);

    updateEnv(customer.apiKey, customer.secretKey);

    console.log("");
    console.log("==================================");
    console.log("Setup Complete");
    console.log("==================================");
    console.log(`API Key    : ${customer.apiKey}`);
    console.log(`Secret Key : ${customer.secretKey}`);
    console.log("");
    console.log("Restart the Collection Backend:");
    console.log("");
    console.log(
      "docker compose -f collection-app/docker-compose.yml restart collection_backend",
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
