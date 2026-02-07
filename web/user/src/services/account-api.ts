import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateExtendedProfileRequest,
  UpdatePasswordRequest,
  VerificationResponse,
  MfaVerification,
  TotpSecretResponse,
  BackupCodesResponse,
} from '@/types';

class AccountApiService {
  private endpoint: string;
  private getAccessToken: (() => Promise<string>) | null = null;

  constructor() {
    this.endpoint = import.meta.env.VITE_LOGTO_ENDPOINT;
  }

  setAccessTokenGetter(getter: () => Promise<string>) {
    this.getAccessToken = getter;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    verificationRecordId?: string
  ): Promise<T> {
    console.log('[AccountAPI] request:', path, options.method || 'GET');

    if (!this.getAccessToken) {
      throw new Error('Access token getter not configured');
    }

    let accessToken: string;
    try {
      accessToken = await this.getAccessToken();
    } catch (err) {
      throw new Error('获取访问令牌失败，请重新登录');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    };

    if (verificationRecordId) {
      (headers as Record<string, string>)['logto-verification-id'] = verificationRecordId;
      console.log('[AccountAPI] Adding logto-verification-id header:', verificationRecordId);
    }

    console.log('[AccountAPI] Sending request to:', `${this.endpoint}${path}`);
    const response = await fetch(`${this.endpoint}${path}`, {
      ...options,
      headers,
    });
    console.log('[AccountAPI] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Handle Logto API error format: { code: "session.invalid_credentials", message: "..." }
      const errorCode = error.code || '';
      let message = error.message || error.error_description || error.error || `请求失败 (${response.status})`;

      // Translate common Logto error codes to Chinese
      if (errorCode === 'session.invalid_credentials' || errorCode.includes('invalid_credentials')) {
        message = '密码错误';
      } else if (errorCode === 'session.verification_session_not_found') {
        message = '验证会话已过期，请重新验证';
      } else if (errorCode === 'session.verification_failed') {
        message = '验证失败，请重试';
      } else if (errorCode.includes('password.rejected')) {
        message = '密码不符合安全要求';
      } else if (response.status === 401) {
        message = '认证失败，请重新登录';
      } else if (response.status === 403) {
        message = '没有权限执行此操作';
      } else if (response.status === 422) {
        message = error.message || '请求数据无效';
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Profile endpoints
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/my-account');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return this.request<UserProfile>('/api/my-account', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateExtendedProfile(data: UpdateExtendedProfileRequest): Promise<UserProfile> {
    return this.request<UserProfile>('/api/my-account/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Verification endpoints
  async verifyPassword(password: string): Promise<VerificationResponse> {
    console.log('[AccountAPI] verifyPassword called');
    const result = await this.request<VerificationResponse>('/api/verifications/password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    console.log('[AccountAPI] verifyPassword response:', result);
    return result;
  }

  async sendVerificationCode(
    type: 'email' | 'phone',
    value: string
  ): Promise<{ verificationId: string }> {
    return this.request<{ verificationId: string }>('/api/verifications/verification-code', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type, value },
      }),
    });
  }

  async verifyCode(
    type: 'email' | 'phone',
    value: string,
    verificationId: string,
    code: string
  ): Promise<VerificationResponse> {
    return this.request<VerificationResponse>('/api/verifications/verification-code/verify', {
      method: 'POST',
      body: JSON.stringify({
        identifier: { type, value },
        verificationId,
        code,
      }),
    });
  }

  // Password endpoints (requires verification)
  async updatePassword(
    data: UpdatePasswordRequest,
    verificationRecordId: string
  ): Promise<void> {
    console.log('[AccountAPI] updatePassword called with verificationRecordId:', verificationRecordId);
    const result = await this.request<void>(
      '/api/my-account/password',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      verificationRecordId
    );
    console.log('[AccountAPI] updatePassword completed');
    return result;
  }

  // Set password for users who don't have one (e.g., social login users)
  async setPassword(data: UpdatePasswordRequest): Promise<void> {
    console.log('[AccountAPI] setPassword called (no verification required)');
    const result = await this.request<void>('/api/my-account/password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('[AccountAPI] setPassword completed');
    return result;
  }

  // Email endpoints (requires verification)
  async updatePrimaryEmail(
    email: string,
    verificationRecordId: string,
    newIdentifierVerificationRecordId: string
  ): Promise<UserProfile> {
    return this.request<UserProfile>(
      '/api/my-account/primary-email',
      {
        method: 'POST',
        body: JSON.stringify({ email, newIdentifierVerificationRecordId }),
      },
      verificationRecordId
    );
  }

  async deletePrimaryEmail(verificationRecordId: string): Promise<void> {
    return this.request<void>(
      '/api/my-account/primary-email',
      { method: 'DELETE' },
      verificationRecordId
    );
  }

  // Phone endpoints (requires verification)
  async updatePrimaryPhone(
    phone: string,
    verificationRecordId: string,
    newIdentifierVerificationRecordId: string
  ): Promise<UserProfile> {
    return this.request<UserProfile>(
      '/api/my-account/primary-phone',
      {
        method: 'PATCH',
        body: JSON.stringify({ phone, newIdentifierVerificationRecordId }),
      },
      verificationRecordId
    );
  }

  async deletePrimaryPhone(verificationRecordId: string): Promise<void> {
    return this.request<void>(
      '/api/my-account/primary-phone',
      { method: 'DELETE' },
      verificationRecordId
    );
  }

  // MFA endpoints
  async getMfaVerifications(): Promise<MfaVerification[]> {
    return this.request<MfaVerification[]>('/api/my-account/mfa-verifications');
  }

  async createTotpSecret(verificationRecordId: string): Promise<TotpSecretResponse> {
    return this.request<TotpSecretResponse>(
      '/api/my-account/mfa-verifications',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'Totp' }),
      },
      verificationRecordId
    );
  }

  async verifyAndBindTotp(
    code: string,
    verificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
      '/api/my-account/mfa-verifications/totp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      },
      verificationRecordId
    );
  }

  async generateBackupCodes(verificationRecordId: string): Promise<BackupCodesResponse> {
    return this.request<BackupCodesResponse>(
      '/api/my-account/mfa-verifications/generate-backup-codes',
      { method: 'POST' },
      verificationRecordId
    );
  }

  async getBackupCodes(): Promise<BackupCodesResponse> {
    return this.request<BackupCodesResponse>('/api/my-account/mfa-verifications/backup-codes');
  }

  async deleteMfaVerification(id: string, verificationRecordId: string): Promise<void> {
    return this.request<void>(
      `/api/my-account/mfa-verifications/${id}`,
      { method: 'DELETE' },
      verificationRecordId
    );
  }

  async updateMfaVerificationName(
    id: string,
    name: string,
    verificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
      `/api/my-account/mfa-verifications/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      },
      verificationRecordId
    );
  }

  // Identity endpoints (social connections)
  async linkSocialIdentity(
    connectorId: string,
    verificationRecordId: string
  ): Promise<{ authorizationUri: string; verificationId: string }> {
    return this.request<{ authorizationUri: string; verificationId: string }>(
      '/api/verifications/social',
      {
        method: 'POST',
        body: JSON.stringify({
          connectorId,
          redirectUri: `${window.location.origin}/user/callback/social`,
          state: crypto.randomUUID(),
        }),
      },
      verificationRecordId
    );
  }

  async verifySocialIdentity(
    connectorId: string,
    verificationId: string,
    callbackData: Record<string, string>
  ): Promise<VerificationResponse> {
    return this.request<VerificationResponse>('/api/verifications/social/verify', {
      method: 'POST',
      body: JSON.stringify({
        connectorId,
        verificationId,
        callbackData,
      }),
    });
  }

  async bindSocialIdentity(
    verificationRecordId: string,
    newIdentifierVerificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
      '/api/my-account/identities',
      {
        method: 'POST',
        body: JSON.stringify({ newIdentifierVerificationRecordId }),
      },
      verificationRecordId
    );
  }

  async unlinkSocialIdentity(
    identityId: string,
    verificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
      `/api/my-account/identities/${identityId}`,
      { method: 'DELETE' },
      verificationRecordId
    );
  }

  // Get available social connectors from sign-in experience
  async getSocialConnectors(): Promise<SocialConnector[]> {
    // This endpoint doesn't require authentication
    const response = await fetch(`${this.endpoint}/api/.well-known/sign-in-exp`);
    if (!response.ok) {
      throw new Error('Failed to fetch social connectors');
    }
    const data = await response.json();
    return data.socialConnectors || [];
  }

  // Start social identity linking flow
  async startSocialLinking(
    connectorId: string,
    redirectUri: string,
    state: string
  ): Promise<{ authorizationUri: string; verificationRecordId: string }> {
    return this.request<{ authorizationUri: string; verificationRecordId: string }>(
      '/api/verifications/social',
      {
        method: 'POST',
        body: JSON.stringify({
          connectorId,
          redirectUri,
          state,
        }),
      }
    );
  }
}

interface SocialConnector {
  id: string;
  target: string;
  platform: string | null;
  name: Record<string, string>;
  logo: string;
  logoDark: string | null;
}

export type { SocialConnector };
export const accountApi = new AccountApiService();
