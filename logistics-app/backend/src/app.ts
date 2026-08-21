import "dotenv/config";
import express, { Request } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import "@/jobs/push-status-updates";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3001";

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

app.use("/api", router);
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("Server running on port 5001");
});
