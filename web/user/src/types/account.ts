// Logto Account API Types

export interface UserProfile {
  id: string;
  username: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  name: string | null;
  avatar: string | null;
  customData: Record<string, unknown>;
  identities: Record<string, Identity>;
  profile: ExtendedProfile;
  applicationId: string | null;
  isSuspended: boolean;
  hasPassword: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExtendedProfile {
  familyName?: string;
  givenName?: string;
  middleName?: string;
  nickname?: string;
  preferredUsername?: string;
  profile?: string;
  website?: string;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  address?: Address;
}

export interface Address {
  formatted?: string;
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface Identity {
  userId: string;
  details?: Record<string, unknown>;
}

export interface MfaVerification {
  id: string;
  type: 'Totp' | 'WebAuthn' | 'BackupCode';
  createdAt: string;
  name?: string;
}

export interface SocialConnector {
  id: string;
  connectorId: string;
  platform: string | null;
  name: Record<string, string>;
  logo: string;
  logoDark: string | null;
  target: string;
}

// API Request Types
export interface UpdateProfileRequest {
  username?: string;
  name?: string;
  avatar?: string;
  customData?: Record<string, unknown>;
}

export interface UpdateExtendedProfileRequest {
  familyName?: string;
  givenName?: string;
  middleName?: string;
  nickname?: string;
  profile?: string;
  website?: string;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  address?: Address;
}

export interface UpdatePasswordRequest {
  password: string;
}

export interface VerificationResponse {
  verificationRecordId: string;
  expiresAt: string;
}

export interface PasswordVerificationRequest {
  password: string;
}

export interface SendVerificationCodeRequest {
  identifier: {
    type: 'email' | 'phone';
    value: string;
  };
}

export interface VerifyCodeRequest {
  identifier: {
    type: 'email' | 'phone';
    value: string;
  };
  verificationId: string;
  code: string;
}

export interface AddMfaRequest {
  type: 'Totp' | 'WebAuthn' | 'BackupCode';
}

export interface TotpSecretResponse {
  verificationId: string;
  secret: string;
  secretQrCode: string;
}

export interface BackupCodesResponse {
  codes: string[];
}
