import axios from "axios";
import fs from "node:fs";
import path from "node:path";

const LOGISTICS_URL = "http://logistics_backend:5001/api";
const COLLECTION_WEBHOOK_URL =
  process.env.COLLECTION_WEBHOOK_URL ??
  "http://collection_backend:5000/api/raw-updates";  
const envPath = path.join(process.cwd(), "collection-app", "backend", ".env");

async function waitForBackend() {
  console.log("Waiting for Logistics Backend...");

  while (true) {
    try {
      await axios.get(`${LOGISTICS_URL}/health`);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("Logistics Backend is ready.");
}

async function registerCustomer() {
  console.log("Registering Collection Application...");

  const { data } = await axios.post(`${LOGISTICS_URL}/customers`, {
    name: "Collection App",
    email: "collection@example.com",
    webhookUrl: COLLECTION_WEBHOOK_URL,
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
    await waitForBackend();

    const customer = await registerCustomer();

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
  }
}

main();
