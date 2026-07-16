import express from "express";
import cors from "cors";
import router from "./routes";
import "@/jobs/push-status-updates";

const app = express();

app.use(cors());
app.use(express.json());



app.use("/api", router);
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("Server running on port 5001");
});
