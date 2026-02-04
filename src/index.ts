import { Hono } from "hono";
import { cors } from "hono/cors";
import logger from "./utils/logger";
import env from "./utils/env";
import { requestLogger } from "./middleware/requestLogger";
import authRoutes from "./routes/auth";
import webhookRoutes from "./routes/webhook";

const app = new Hono();

// Global middleware
app.use("*", cors());
app.use("*", requestLogger);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Mount routes
app.route("/auth", authRoutes);
app.route("/webhook", webhookRoutes);

async function run() {
  const server = Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  });

  logger.info(`Server running at ${server.url}`);
  logger.info(`Logto endpoint: ${env.LOGTO_ENDPOINT}`);

  process.on("SIGINT", () => {
    logger.info("Received SIGINT. Shutting down...");
    server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM. Shutting down...");
    server.stop();
    process.exit(0);
  });
}

run().catch((e) => {
  logger.error("Server failed to start:", e);
  process.exit(1);
});
