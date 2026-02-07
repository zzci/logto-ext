import { serveStatic } from "hono/bun";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import logger from "./utils/logger";
import env from "./utils/env";
import app from "./app";

// --- Serve User Account SPA at /user/* ---
const userDistPath = resolve(import.meta.dir, "../dist/user");
const userIndexPath = resolve(userDistPath, "index.html");

if (existsSync(userIndexPath)) {
  const userIndexHtml = readFileSync(userIndexPath, "utf-8");

  // Serve static assets (JS, CSS, images, etc.)
  app.use(
    "/user/*",
    serveStatic({
      root: "./dist/user",
      rewriteRequestPath: (path) => path.replace(/^\/user/, ""),
    })
  );

  // SPA fallback: return index.html for any /user path
  app.get("/user", (c) => c.html(userIndexHtml));
  app.get("/user/*", (c) => c.html(userIndexHtml));

  logger.info("User account SPA enabled at /user/");
} else {
  logger.warn("User SPA not found at dist/user/ - run 'bun run build:web' first");
}

async function run() {
  const server = Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  });

  logger.info(`Server running at ${server.url}`);

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
