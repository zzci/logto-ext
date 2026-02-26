import { Context, Next } from "hono";
import env from "../utils/env";
import logger from "../utils/logger";

export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header("X-API-Key") || c.req.header("Authorization")?.replace("Bearer ", "");

  if (!env.API_KEY) {
    logger.warn("API_KEY not configured, skipping authentication");
    return next();
  }

  if (!apiKey) {
    return c.json({ success: false, message: "Missing API key" }, 401);
  }

  if (apiKey !== env.API_KEY) {
    logger.warn("Invalid API key attempt");
    return c.json({ success: false, message: "Invalid API key" }, 401);
  }

  return next();
}
