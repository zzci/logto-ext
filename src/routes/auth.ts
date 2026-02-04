import { Hono } from "hono";
import authService from "../services/auth";
import logger from "../utils/logger";

const auth = new Hono();

auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ success: false, message: "Missing username or password" }, 400);
    }

    const result = await authService.login(username, password);

    if (!result.success) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    return c.json({
      success: true,
      message: "Login successful",
      userId: result.user?.id,
    });
  } catch (error) {
    logger.error("Login error:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
});

export default auth;
