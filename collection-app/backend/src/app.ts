import "dotenv/config";
import express, { Request } from "express";
import { connectRedis } from "@/config/redis";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import { startRawUpdateProcessorJob } from "@/jobs/rawUpdateProcessorJob";
import { startOutboundWebhookProcessorJob } from "@/jobs/outboundWebhookProcessorJob";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Signature",
    ],
  }),
);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request).rawBody = buf;
    },
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

app.use("/api", router);
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    startRawUpdateProcessorJob();
    startOutboundWebhookProcessorJob();
  });
}
startServer();