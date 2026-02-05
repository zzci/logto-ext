import { Hono } from "hono";
import logger from "../utils/logger";

const user = new Hono();

// 用户信息
user.get("/profile", async (c) => {
  try {
    // TODO: 从认证中间件获取用户信息
    return c.json({
      success: true,
      message: "User profile endpoint",
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
});

// 健康检查
user.get("/health", (c) => c.json({ status: "ok" }));

export default user;
