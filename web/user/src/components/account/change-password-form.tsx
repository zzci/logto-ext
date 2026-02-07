import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { Button, PasswordInput, Alert } from '@/components/ui';
import { accountApi } from '@/services';

interface ChangePasswordFormProps {
  hasPassword: boolean;
  onSuccess?: () => void;
}

export function ChangePasswordForm({ hasPassword, onSuccess }: ChangePasswordFormProps) {
  const { t } = useTranslation();

  // Step 1: verify current password
  const [currentPassword, setCurrentPassword] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Verification result
  const [verificationRecordId, setVerificationRecordId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Step 2: set new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer for verification expiry
  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        setVerificationRecordId(null);
        setExpiresAt(null);
        setNewPassword('');
        setConfirmPassword('');
        setSubmitError(null);
        setExpired(true);
      }
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [expiresAt]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return;

    setVerifyError(null);
    setExpired(false);
    setIsVerifying(true);
    try {
      const response = await accountApi.verifyPassword(currentPassword);
      setVerificationRecordId(response.verificationRecordId);
      setExpiresAt(new Date(response.expiresAt).getTime());
      setCurrentPassword('');
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : t('security.password.verifyFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    if (!newPassword) {
      setSubmitError(t('security.password.validation.required'));
      return;
    }
    if (newPassword.length < 8) {
      setSubmitError(t('security.password.validation.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setSubmitError(t('security.password.validation.mismatch'));
      return;
    }

    if (!verificationRecordId || (expiresAt && Date.now() >= expiresAt)) {
      setSubmitError(t('security.password.validation.expiredRetry'));
      setVerificationRecordId(null);
      setExpiresAt(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await accountApi.updatePassword({ password: newPassword }, verificationRecordId);
      setSuccess(t('security.password.changeSuccess'));
      setVerificationRecordId(null);
      setExpiresAt(null);
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('security.password.changeFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setVerificationRecordId(null);
    setExpiresAt(null);
    setNewPassword('');
    setConfirmPassword('');
    setSubmitError(null);
    setSuccess(null);
    clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // No password set — show simple set-password form
  if (!hasPassword) {
    return <SetPasswordForm onSuccess={onSuccess} />;
  }

  // Step 1: Verify current password
  if (!verificationRecordId) {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        {expired && <Alert type="warning">{t('security.password.expired')}</Alert>}
        {verifyError && <Alert type="error">{verifyError}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <PasswordInput
          label={t('security.password.currentPassword')}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t('security.password.currentPasswordPlaceholder')}
          autoFocus
        />

        <Button type="submit" loading={isVerifying} disabled={!currentPassword}>
          {t('security.password.verifyButton')}
        </Button>
      </form>
    );
  }

  // Step 2: Set new password (after verification)
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>{t('security.password.verified')}</span>
        <span className="ml-auto text-green-600 font-mono tabular-nums">
          {formatTime(remainingSeconds)}
        </span>
      </div>

      {submitError && <Alert type="error">{submitError}</Alert>}

      <PasswordInput
        label={t('security.password.newPassword')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder={t('security.password.newPasswordPlaceholder')}
        hint={t('security.password.newPasswordHint')}
        autoFocus
      />

      <PasswordInput
        label={t('security.password.confirmPassword')}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder={t('security.password.confirmPasswordPlaceholder')}
      />

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={handleReset}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!newPassword || !confirmPassword}
        >
          {t('security.password.changeButton')}
        </Button>
      </div>
    </form>
  );
}

/** Simple form for users who don't have a password yet */
function SetPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword) {
      setError(t('security.password.validation.setRequired'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('security.password.validation.setMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('security.password.validation.setMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await accountApi.setPassword({ password: newPassword });
      setSuccess(t('security.password.setSuccess'));
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('security.password.setFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {!success && (
        <Alert type="info">
          {t('security.password.noPasswordInfo')}
        </Alert>
      )}

      <PasswordInput
        label={t('security.password.passwordLabel')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder={t('security.password.passwordPlaceholder')}
        hint={t('security.password.newPasswordHint')}
      />

      <PasswordInput
        label={t('security.password.confirmLabel')}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder={t('security.password.confirmPlaceholder')}
      />

      <Button
        type="submit"
        loading={isSubmitting}
        disabled={!newPassword || !confirmPassword}
      >
        {t('security.password.setButton')}
      </Button>
    </form>
  );
}
