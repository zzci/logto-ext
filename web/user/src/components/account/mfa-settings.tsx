import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, Trash2, Plus } from 'lucide-react';
import { Button, Alert, Card, CardHeader, CardTitle, CardContent, Input, Modal } from '@/components/ui';
import { useVerificationStore } from '@/stores';
import { useMfa } from '@/hooks';
import { formatDate } from '@/lib/utils';

export function MfaSettings() {
  const { t } = useTranslation();
  const { mfaVerifications, isLoading, createTotp, bindTotp, deleteMfa } = useMfa();
  const verify = useVerificationStore((s) => s.verify);

  // TOTP setup state
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    qrCode: string;
    recordId: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAddTotp = async () => {
    setError(null);
    setSuccess(null);
    try {
      const recordId = await verify({ description: t('security.mfa.addVerify') });
      const result = await createTotp(recordId);
      setTotpSetup({
        secret: result.secret,
        qrCode: result.secretQrCode,
        recordId,
      });
    } catch (err) {
      if (err instanceof Error && err.message !== 'cancelled') {
        setError(err.message);
      }
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpSetup || !totpCode) return;
    setError(null);
    try {
      await bindTotp({ secret: totpSetup.secret, code: totpCode, verificationRecordId: totpSetup.recordId });
      setTotpSetup(null);
      setTotpCode('');
      setSuccess(t('security.mfa.totpEnabled'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('security.mfa.codeError'));
    }
  };

  const handleDeleteMfa = async () => {
    if (!deleteTarget) return;
    setError(null);
    setSuccess(null);
    setDeleteTarget(null);
    try {
      const recordId = await verify({ description: t('security.mfa.deleteVerify') });
      await deleteMfa({ id: deleteTarget, verificationRecordId: recordId });
      setSuccess(t('security.mfa.deleteSuccess'));
    } catch (err) {
      if (err instanceof Error && err.message !== 'cancelled') {
        setError(err.message);
      }
    }
  };

  if (isLoading) {
    return <div className="text-gray-500 text-sm py-4 text-center">{t('common.loading')}</div>;
  }

  const hasTotpEnabled = mfaVerifications.some((m) => m.type === 'Totp');

  return (
    <div className="space-y-4">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Current MFA Methods */}
      {mfaVerifications.length > 0 && (
        <div className="space-y-2">
          {mfaVerifications.map((mfa) => (
            <div
              key={mfa.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-white rounded-lg text-primary-600 flex-shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {mfa.type === 'Totp' ? t('security.mfa.totpApp') : mfa.type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('security.mfa.addedAt', { date: formatDate(new Date(mfa.createdAt).getTime()) })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(mfa.id)}
                className="p-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white active:bg-red-50 transition-colors flex-shrink-0"
                aria-label={t('security.mfa.deleteAriaLabel')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TOTP Setup */}
      {totpSetup ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('security.mfa.setupTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('security.mfa.setupDescription')}
            </p>
            <div className="flex justify-center">
              <img
                src={totpSetup.qrCode}
                alt="TOTP QR Code"
                className="w-44 h-44 sm:w-48 sm:h-48 border rounded-lg"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">{t('security.mfa.manualEntry')}</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded select-all break-all">{totpSetup.secret}</code>
            </div>

            <Input
              label={t('security.mfa.codeLabel')}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder={t('security.mfa.codePlaceholder')}
              maxLength={6}
              autoFocus
              inputMode="numeric"
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setTotpSetup(null); setTotpCode(''); }} className="flex-1 sm:flex-none">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleVerifyTotp} disabled={totpCode.length !== 6} className="flex-1 sm:flex-none">
                {t('security.mfa.verifyAndEnable')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !hasTotpEnabled ? (
        <button
          onClick={handleAddTotp}
          className="flex items-center gap-3 w-full p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100 transition-colors text-left"
        >
          <div className="p-2 bg-primary-100 rounded-lg text-primary-600 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm">{t('security.mfa.addTotp')}</p>
            <p className="text-xs text-gray-500">{t('security.mfa.addTotpDescription')}</p>
          </div>
          <Plus className="w-5 h-5 ml-auto text-gray-400 flex-shrink-0" />
        </button>
      ) : null}

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('security.mfa.deleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('security.mfa.deleteConfirm')}
          </p>
          <div className="flex gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 sm:flex-none">
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteMfa} className="flex-1 sm:flex-none">
              {t('security.mfa.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
