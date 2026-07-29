import express from "express";
import cors from "cors";
import router from "./routes";
import { startRawUpdateProcessorJob } from "@/jobs/rawUpdateProcessorJob";
import { startOutboundWebhookProcessorJob } from "@/jobs/outboundWebhookProcessorJob";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

app.use("/api", router);
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startRawUpdateProcessorJob();
  startOutboundWebhookProcessorJob();
});
