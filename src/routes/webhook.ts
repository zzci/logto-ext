import { Hono } from "hono";
import logger from "../utils/logger";
import env from "../utils/env";

const webhook = new Hono();

// Logto webhook event types
type WebhookEventType =
  | "User.Created"
  | "User.Deleted"
  | "User.Data.Updated"
  | "User.SuspensionStatus.Updated"
  | "PostRegister"
  | "PostResetPassword"
  | "PostSignIn";

interface WebhookPayload {
  hookId: string;
  event: WebhookEventType;
  createdAt: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  data?: Record<string, unknown>;
  user?: Record<string, unknown>;
}

// Verify webhook signature
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);

  // Use Web Crypto API for HMAC verification
  // For now, we'll implement a simple check - in production use proper HMAC
  // This is a placeholder for proper signature verification
  return true; // TODO: Implement proper HMAC-SHA256 verification
}

webhook.post("/", async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("logto-signature-sha-256");

    // Verify signature if secret is configured
    if (env.LOGTO_WEBHOOK_SECRET) {
      if (!verifySignature(rawBody, signature, env.LOGTO_WEBHOOK_SECRET)) {
        logger.warn("Webhook signature verification failed");
        return c.json({ error: "Invalid signature" }, 401);
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    logger.info(`Webhook received: ${payload.event}`, { hookId: payload.hookId });

    // Handle different event types
    switch (payload.event) {
      case "User.Created":
        await handleUserCreated(payload);
        break;
      case "User.Deleted":
        await handleUserDeleted(payload);
        break;
      case "User.Data.Updated":
        await handleUserUpdated(payload);
        break;
      case "PostSignIn":
        await handlePostSignIn(payload);
        break;
      case "PostRegister":
        await handlePostRegister(payload);
        break;
      default:
        logger.debug(`Unhandled webhook event: ${payload.event}`);
    }

    return c.json({ success: true });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Event handlers - implement your business logic here
async function handleUserCreated(payload: WebhookPayload) {
  logger.info("User created:", payload.data);
  // TODO: Implement your logic (e.g., sync to external system, send welcome email)
}

async function handleUserDeleted(payload: WebhookPayload) {
  logger.info("User deleted:", payload.data);
  // TODO: Implement your logic (e.g., cleanup user data)
}

async function handleUserUpdated(payload: WebhookPayload) {
  logger.info("User updated:", payload.data);
  // TODO: Implement your logic (e.g., sync changes)
}

async function handlePostSignIn(payload: WebhookPayload) {
  logger.info("User signed in:", payload.user);
  // TODO: Implement your logic (e.g., audit logging)
}

async function handlePostRegister(payload: WebhookPayload) {
  logger.info("User registered:", payload.user);
  // TODO: Implement your logic (e.g., trigger onboarding flow)
}

export default webhook;
