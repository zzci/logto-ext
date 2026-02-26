import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateExtendedProfileRequest,
  UpdatePasswordRequest,
  VerificationResponse,
  MfaVerification,
  TotpSecretResponse,
  SocialConnector,
} from '@/types';
import { getConfig } from '@/lib/config';
import i18n from '@/i18n';

class AccountApiService {
  private getAccessToken: (() => Promise<string>) | null = null;

  private get endpoint(): string {
    return getConfig().logtoEndpoint;
  }

  setAccessTokenGetter(getter: () => Promise<string>) {
    this.getAccessToken = getter;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    verificationRecordId?: string
  ): Promise<T> {
    if (!this.getAccessToken) {
      throw new Error('Access token getter not configured');
    }

    let accessToken: string;
    try {
      accessToken = await this.getAccessToken();
    } catch (err) {
      throw new Error(i18n.t('errors.accessTokenFailed'));
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    };

    if (verificationRecordId) {
      (headers as Record<string, string>)['logto-verification-id'] = verificationRecordId;
    }

    const response = await fetch(`${this.endpoint}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Handle Logto API error format: { code: "session.invalid_credentials", message: "..." }
      const errorCode = error.code || '';
      let message = error.message || error.error_description || error.error || i18n.t('errors.requestFailed', { status: response.status });

      // Translate common Logto error codes
      if (errorCode === 'session.invalid_credentials' || errorCode.includes('invalid_credentials')) {
        message = i18n.t('errors.wrongPassword');
      } else if (errorCode === 'session.verification_session_not_found') {
        message = i18n.t('errors.verificationExpired');
      } else if (errorCode === 'session.verification_failed') {
        message = i18n.t('errors.verificationFailed');
      } else if (errorCode.includes('password.rejected')) {
        message = i18n.t('errors.passwordRejected');
      } else if (response.status === 401) {
        message = i18n.t('errors.authFailed');
      } else if (response.status === 403) {
        message = i18n.t('errors.forbidden');
      } else if (response.status === 422) {
        message = error.message || i18n.t('errors.invalidData');
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
    return this.request<VerificationResponse>('/api/verifications/password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
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
    return this.request<void>(
      '/api/my-account/password',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      verificationRecordId
    );
  }

  // Set password for users who don't have one (e.g., social login users)
  async setPassword(data: UpdatePasswordRequest): Promise<void> {
    return this.request<void>('/api/my-account/password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Email endpoints (requires verification)
  async updatePrimaryEmail(
    email: string,
    verificationRecordId: string,
    newIdentifierVerificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
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
  ): Promise<void> {
    return this.request<void>(
      '/api/my-account/primary-phone',
      {
        method: 'POST',
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

  async generateTotpSecret(verificationRecordId: string): Promise<TotpSecretResponse> {
    return this.request<TotpSecretResponse>(
      '/api/my-account/mfa-verifications/totp-secret/generate',
      { method: 'POST' },
      verificationRecordId
    );
  }

  async bindTotp(
    secret: string,
    code: string,
    verificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
      '/api/my-account/mfa-verifications',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'Totp', secret, code }),
      },
      verificationRecordId
    );
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
    target: string,
    verificationRecordId: string
  ): Promise<void> {
    return this.request<void>(
      `/api/my-account/identities/${target}`,
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
  ): Promise<{ authorizationUri: string; verificationId: string }> {
    return this.request<{ authorizationUri: string; verificationId: string }>(
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

export const accountApi = new AccountApiService();
