import axios from "axios";
import crypto from "node:crypto";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const setupDir = path.join(process.cwd(), "setup");
dotenv.config({ path: path.join(setupDir, ".env") });

const LOGISTICS_URL = process.env.LOGISTICS_URL?.trim();
const COLLECTION_WEBHOOK_URL = process.env.COLLECTION_WEBHOOK_URL?.trim();
const STAFF_API_KEY = process.env.STAFF_API_KEY?.trim();
const STAFF_SECRET_KEY = process.env.STAFF_SECRET_KEY?.trim();
const envPath = path.join(process.cwd(), "collection-app", "backend", ".env");

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy setup/.env.example to setup/.env and configure it.`,
    );
  }
  return value;
}

function generateApiKey() {
  return `pk_${crypto.randomBytes(24).toString("hex")}`;
}

function generateSecretKey() {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
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

async function registerCustomer(
  logisticsUrl: string,
  webhookUrl: string,
  apiKey: string,
  secretKey: string,
  staffApiKey: string,
  staffSecretKey: string,
) {
  console.log("Registering Collection Application...");

  const payload = {
    name: "Collection App",
    email: "collection@example.com",
    webhookUrl,
    apiKey,
    secretKey,
  };
  const body = JSON.stringify(payload);
  const signature = generateSignature(body, staffSecretKey);

  await axios.post(`${logisticsUrl}/customers`, payload, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": staffApiKey,
      "x-signature": signature,
    },
  });

  return { apiKey, secretKey };
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
    const staffApiKey = requireEnv("STAFF_API_KEY", STAFF_API_KEY);
    const staffSecretKey = requireEnv("STAFF_SECRET_KEY", STAFF_SECRET_KEY);

    if (!fs.existsSync(envPath)) {
      throw new Error(
        `Missing ${envPath}. Create it before running setup (see README).`,
      );
    }

    await waitForBackend(logisticsUrl);

    const apiKey = generateApiKey();
    const secretKey = generateSecretKey();

    await registerCustomer(
      logisticsUrl,
      webhookUrl,
      apiKey,
      secretKey,
      staffApiKey,
      staffSecretKey,
    );

    updateEnv(apiKey, secretKey);

    console.log("");
    console.log("==================================");
    console.log("Setup Complete");
    console.log("==================================");
    console.log(`API Key    : ${apiKey}`);
    console.log(`Secret Key : ${secretKey}`);
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
