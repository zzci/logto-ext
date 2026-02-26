/**
 * Logto Management API Client
 * Provides low-level access to Logto Admin APIs
 */

import logger from "../utils/logger";
import env from "../utils/env";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LogtoUser {
  id: string;
  username: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  name: string | null;
  avatar?: string | null;
  customData?: Record<string, unknown>;
  identities?: Record<string, unknown>;
  lastSignInAt?: number;
  createdAt?: number;
  updatedAt?: number;
  isSuspended?: boolean;
  hasPassword?: boolean;
}

export interface UpdateUserData {
  username?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  name?: string;
  avatar?: string;
  customData?: Record<string, unknown>;
}

class LogtoService {
  private endpoint: string;
  private appId: string;
  private appSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.endpoint = env.LOGTO_ENDPOINT.replace(/\/$/, "");
    this.appId = env.LOGTO_M2M_APP_ID;
    this.appSecret = env.LOGTO_M2M_APP_SECRET;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const tokenEndpoint = `${this.endpoint}/oidc/token`;
    const resource = "https://default.logto.app/api";

    logger.debug("Fetching new access token from Logto");

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${this.appId}:${this.appSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        resource: resource,
        scope: "all",
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Failed to get access token: ${response.status}`, errorText);
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    logger.debug("Access token refreshed successfully");
    return this.accessToken;
  }

  /**
   * Make authenticated GET request to Management API
   */
  async get<T>(path: string): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API GET failed: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make authenticated POST request to Management API
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API POST failed: ${response.status} ${errorText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make authenticated PATCH request to Management API
   */
  async patch<T>(path: string, body: unknown): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}${path}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API PATCH failed: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make authenticated DELETE request to Management API
   */
  async delete(path: string): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API DELETE failed: ${response.status} ${errorText}`);
    }
  }

  /**
   * Make raw authenticated request (for special cases like password verification)
   */
  async raw(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken();

    return fetch(`${this.endpoint}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  // ============ User APIs ============

  async getUser(userId: string): Promise<LogtoUser | null> {
    try {
      return await this.get<LogtoUser>(`/api/users/${userId}`);
    } catch {
      return null;
    }
  }

  async getUsers(params?: URLSearchParams): Promise<LogtoUser[]> {
    const query = params ? `?${params.toString()}` : "";
    return this.get<LogtoUser[]>(`/api/users${query}`);
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<LogtoUser> {
    return this.patch<LogtoUser>(`/api/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.delete(`/api/users/${userId}`);
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await this.patch(`/api/users/${userId}/password`, { password });
  }

  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const response = await this.raw(`/api/users/${userId}/password/verify`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (response.status === 204) return true;
    if (response.status === 422) return false;

    const errorText = await response.text();
    throw new Error(`Password verification failed: ${response.status} ${errorText}`);
  }

  async suspendUser(userId: string): Promise<LogtoUser> {
    return this.patch<LogtoUser>(`/api/users/${userId}/is-suspended`, { isSuspended: true });
  }

  async unsuspendUser(userId: string): Promise<LogtoUser> {
    return this.patch<LogtoUser>(`/api/users/${userId}/is-suspended`, { isSuspended: false });
  }
}

export const logto = new LogtoService();
export default logto;
