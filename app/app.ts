import { Hono } from "hono";
import { cors } from "hono/cors";
import logger from "./utils/logger";
import env from "./utils/env";
import { requestLogger } from "./middleware/requestLogger";
import { apiKeyAuth } from "./middleware/apiKey";
import authRoutes from "./routes/auth";
import webhookRoutes from "./routes/webhook";

// Main app
const app = new Hono();

// /ext basePath - Extension API
const extApp = new Hono().basePath("/ext");
extApp.use("*", cors());
extApp.use("*", requestLogger);
extApp.get("/health", (c) => c.json({ status: "ok" }));
// Apply API key auth to auth and webhook routes
extApp.use("/auth/*", apiKeyAuth);
extApp.use("/webhook/*", apiKeyAuth);
extApp.route("/auth", authRoutes);
extApp.route("/webhook", webhookRoutes);

// Mount ext API
app.route("/", extApp);

// Runtime config for user SPA
app.get("/user/config.json", (c) => {
  return c.json({
    logtoEndpoint: env.LOGTO_SPA_ENDPOINT,
    logtoAppId: env.LOGTO_SPA_APP_ID,
    appUrl: env.APP_URL,
  });
});

logger.info(`Logto endpoint: ${env.LOGTO_ENDPOINT}`);

export default app;
