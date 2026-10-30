import { serveStatic } from "hono/bun";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import logger from "./utils/logger";
import env from "./utils/env";
import { VERSION } from "./utils/version";
import { isSupervised, Lode, onTerminate } from "./lode/sdk";
import app from "./app";

// --- Serve User Account SPA at /user/* ---
// Packaged release: index.js sits next to public/. Source checkout: app/../frontend/dist.
const userDistPath = [
  resolve(import.meta.dir, "public"),
  resolve(import.meta.dir, "../frontend/dist"),
].find((dir) => existsSync(resolve(dir, "index.html")));

if (userDistPath) {
  const userIndexHtml = readFileSync(resolve(userDistPath, "index.html"), "utf-8");

  // Serve static assets (JS, CSS, images, etc.)
  app.use(
    "/user/*",
    serveStatic({
      root: userDistPath,
      rewriteRequestPath: (path) => path.replace(/^\/user/, ""),
    }),
  );

  // SPA fallback: return index.html for any /user path
  app.get("/user", (c) => c.html(userIndexHtml));
  app.get("/user/*", (c) => c.html(userIndexHtml));

  logger.info(`User account SPA enabled at /user/ (${userDistPath})`);
} else {
  logger.warn(
    "User SPA not found at frontend/dist/ - run 'bun run build:web' first",
  );
}

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

logger.info(`logto-ext ${VERSION} running at ${server.url}`);

onTerminate(async () => {
  logger.info("Shutting down...");
  await server.stop();
});

// Under lode with readiness = "state": commit this version only once we serve.
if (isSupervised()) {
  Lode.fromEnv().markReady();
  logger.info("Reported ready to lode");
}
