import { useState } from 'react';
import { Button, PasswordInput, Alert } from '@/components/ui';
import { accountApi } from '@/services';

interface ChangePasswordFormProps {
  hasPassword: boolean;
  onSuccess?: () => void;
}

export function ChangePasswordForm({ hasPassword, onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (hasPassword && !currentPassword) {
      setError('请输入当前密码');
      return;
    }

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }

    if (newPassword.length < 8) {
      setError('新密码至少需要8个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      if (hasPassword) {
        // Step 1: Verify current password
        const verifyResponse = await accountApi.verifyPassword(currentPassword);

        // Step 2: Update password with verification ID
        await accountApi.updatePassword(
          { password: newPassword },
          verifyResponse.verificationRecordId
        );
      } else {
        // User has no password - set new password directly
        await accountApi.setPassword({ password: newPassword });
      }

      // Success - clear form and show success message
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    } catch (err) {
      console.error('[ChangePassword] Error:', err);
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      console.log('[ChangePassword] Error message:', errorMessage);

      // Translate common errors - don't clear form on error
      if (
        errorMessage.includes('密码错误') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('incorrect') ||
        errorMessage.toLowerCase().includes('credentials')
      ) {
        setError('当前密码错误，请重新输入');
      } else if (errorMessage.includes('session') || errorMessage.includes('过期')) {
        setError('会话已过期，请刷新页面重试');
      } else if (errorMessage.includes('密码不符合') || errorMessage.includes('rejected')) {
        setError('新密码不符合安全要求，请使用更复杂的密码');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      {success && (
        <Alert type="success" title={hasPassword ? '密码已修改' : '密码已设置'}>
          {hasPassword
            ? '您的密码已成功更新，下次登录时请使用新密码。'
            : '您的密码已成功设置，现在可以使用密码登录。'}
        </Alert>
      )}

      {!hasPassword && !success && (
        <Alert type="info">
          您的账户尚未设置密码，设置密码后可以使用密码登录。
        </Alert>
      )}

      {!success && (
        <>
          {hasPassword && (
            <PasswordInput
              label="当前密码"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="请输入当前密码"
            />
          )}

          <PasswordInput
            label="新密码"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少8个字符"
            hint="建议使用字母、数字和符号的组合"
          />

          <PasswordInput
            label="确认新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
          />

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={hasPassword ? !currentPassword || !newPassword || !confirmPassword : !newPassword || !confirmPassword}
          >
            {hasPassword ? '修改密码' : '设置密码'}
          </Button>
        </>
      )}

      {success && (
        <Button type="button" variant="outline" onClick={handleReset}>
          再次修改
        </Button>
      )}
    </form>
  );
}
