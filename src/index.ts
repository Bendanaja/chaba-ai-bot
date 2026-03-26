import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { middleware } from "@line/bot-sdk";
import { config } from "./config.js";
import { lineWebhookHandler } from "./routes/line-webhook.js";
import { kieaiCallbackHandler } from "./routes/kieai-callback.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Static files (mascot image etc.)
app.use("/public", express.static(path.join(__dirname, "..", "public")));

// LINE webhook — uses LINE SDK middleware for signature verification
app.post(
  "/webhook/line",
  middleware({ channelSecret: config.line.channelSecret }),
  lineWebhookHandler
);

// Kie.ai callback — standard JSON parser
app.post("/webhook/kieai", express.json(), kieaiCallbackHandler);

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", name: "Chaba AI Bot" });
});

// Error handler — catches LINE signature validation failures etc.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express error:", err.message || err);
  if (!res.headersSent) {
    res.status(err.statusCode || 500).json({ error: err.message || "Internal error" });
  }
});

app.listen(config.port, () => {
  console.log(`Chaba bot running on port ${config.port}`);
  console.log(`LINE webhook: /webhook/line`);
  console.log(`Kie.ai callback: /webhook/kieai`);
});
