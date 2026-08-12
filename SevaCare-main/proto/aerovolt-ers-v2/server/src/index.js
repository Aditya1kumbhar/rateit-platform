// src/index.js – Express server entry point
import express from "express";
import cors from "cors";
import telemetryRouter from "../routes/telemetry.js";
import { config } from "../config/env.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Telemetry pipeline
app.use("/api/telemetry", telemetryRouter);

// Start server (only when run directly, not when imported for testing)
const server = app.listen(config.port, () => {
  console.log(`🚀 AeroVolt ERS listening on http://localhost:${config.port}`);
});

// Export for supertest
export default app;
export { server };
