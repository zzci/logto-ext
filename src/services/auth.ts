/**
 * Authentication Service
 * Handles user authentication logic using Logto APIs
 */

import logto, { type LogtoUser } from "./logto";
import logger from "../utils/logger";

export interface LoginResult {
  success: boolean;
  user?: LogtoUser;
  error?: string;
}

class AuthService {
  /**
   * Find user by username (exact match)
   */
  async findUserByUsername(username: string): Promise<LogtoUser | null> {
    const params = new URLSearchParams([
      ["search.username", username],
      ["mode.username", "exact"],
    ]);

    const users = await logto.getUsers(params);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find user by email (exact match)
   */
  async findUserByEmail(email: string): Promise<LogtoUser | null> {
    const params = new URLSearchParams([
      ["search.primaryEmail", email],
      ["mode.primaryEmail", "exact"],
    ]);

    const users = await logto.getUsers(params);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find user by username or email (auto-detect)
   */
  async findUser(usernameOrEmail: string): Promise<LogtoUser | null> {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameOrEmail);
    return isEmail ? this.findUserByEmail(usernameOrEmail) : this.findUserByUsername(usernameOrEmail);
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(usernameOrEmail: string, password: string): Promise<LoginResult> {
    const user = await this.findUser(usernameOrEmail);

    if (!user) {
      logger.debug(`User not found: ${usernameOrEmail}`);
      return { success: false, error: "User not found" };
    }

    if (user.isSuspended) {
      logger.debug(`User is suspended: ${usernameOrEmail}`);
      return { success: false, error: "User is suspended" };
    }

    const isValid = await logto.verifyUserPassword(user.id, password);

    if (!isValid) {
      logger.debug(`Invalid password for user: ${usernameOrEmail}`);
      return { success: false, error: "Invalid password" };
    }

    return { success: true, user };
  }

  /**
   * Login user and return user info
   */
  async login(usernameOrEmail: string, password: string): Promise<LoginResult> {
    logger.info(`Login attempt for: ${usernameOrEmail}`);

    const result = await this.verifyCredentials(usernameOrEmail, password);

    if (result.success) {
      logger.info(`Login successful for: ${usernameOrEmail} (${result.user?.id})`);
    } else {
      logger.warn(`Login failed for: ${usernameOrEmail} - ${result.error}`);
    }

    return result;
  }
}

export const authService = new AuthService();
export default authService;
