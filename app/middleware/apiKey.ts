import type { Context, Next } from "hono";
import { timingSafeEqual } from "crypto";
import env from "../utils/env";
import logger from "../utils/logger";

if (!env.API_KEY) {
  logger.warn("API_KEY not configured - /ext/auth and /ext/webhook are unauthenticated");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function apiKeyAuth(c: Context, next: Next) {
  if (!env.API_KEY) {
    return next();
  }

  const bearer = c.req.header("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const apiKey = c.req.header("X-API-Key") || bearer;

  if (!apiKey) {
    return c.json({ success: false, message: "Missing API key" }, 401);
  }

  if (!safeEqual(apiKey, env.API_KEY)) {
    logger.warn("Invalid API key attempt");
    return c.json({ success: false, message: "Invalid API key" }, 401);
  }

  return next();
}
