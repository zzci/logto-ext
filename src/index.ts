import { Hono } from "hono";
import { cors } from "hono/cors";
import logger from "./utils/logger";
import env from "./utils/env";
import { requestLogger } from "./middleware/requestLogger";
import authRoutes from "./routes/auth";
import webhookRoutes from "./routes/webhook";
import userRoutes from "./routes/user";

// Main app
const app = new Hono();

// /ext basePath - Extension API
const extApp = new Hono().basePath("/ext");
extApp.use("*", cors());
extApp.use("*", requestLogger);
extApp.get("/health", (c) => c.json({ status: "ok" }));
extApp.route("/auth", authRoutes);
extApp.route("/webhook", webhookRoutes);

// /user basePath - User Center
const userApp = new Hono().basePath("/user");
userApp.use("*", cors());
userApp.use("*", requestLogger);
userApp.get("/health", (c) => c.json({ status: "ok" }));
userApp.route("/", userRoutes);

// Mount both apps
app.route("/", extApp);
app.route("/", userApp);

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
