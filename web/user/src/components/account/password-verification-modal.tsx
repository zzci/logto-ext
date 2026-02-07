import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, PasswordInput, Modal, Alert } from '@/components/ui';
import { useVerificationStore } from '@/stores';

export function PasswordVerificationModal() {
  const { t } = useTranslation();
  const { isOpen, title, description, isLoading, error, submitPassword, cancel } =
    useVerificationStore();
  const [password, setPassword] = useState('');

  // Clear password when modal opens/closes
  useEffect(() => {
    if (!isOpen) setPassword('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    await submitPassword(password);
  };

  return (
    <Modal isOpen={isOpen} onClose={cancel} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        {error && <Alert type="error">{error}</Alert>}

        <PasswordInput
          label={t('security.verification.passwordLabel')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('security.verification.passwordPlaceholder')}
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={cancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isLoading} disabled={!password}>
            {t('common.verify')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
