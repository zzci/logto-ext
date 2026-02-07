import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, PhoneInput, Alert, Modal } from '@/components/ui';
import { useVerificationStore } from '@/stores';
import { accountApi } from '@/services';
import { formatPhone } from '@/lib/utils';
import type { UserProfile } from '@/types';

interface EmailPhoneSettingsProps {
  profile: UserProfile;
  onUpdate: () => void;
}

type FieldType = 'email' | 'phone';

export function EmailPhoneSettings({ profile, onUpdate }: EmailPhoneSettingsProps) {
  const { t } = useTranslation();
  const verify = useVerificationStore((s) => s.verify);

  const [editingField, setEditingField] = useState<FieldType | null>(null);
  const [verificationRecordId, setVerificationRecordId] = useState<string | null>(null);

  // Form state
  const [newValue, setNewValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeVerificationId, setCodeVerificationId] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Confirm delete
  const [deleteField, setDeleteField] = useState<FieldType | null>(null);

  const resetForm = () => {
    setEditingField(null);
    setVerificationRecordId(null);
    setNewValue('');
    setVerificationCode('');
    setCodeVerificationId(null);
    setCodeSent(false);
    setError(null);
  };

  const handleStartEdit = async (field: FieldType) => {
    setError(null);
    setSuccess(null);
    try {
      const description = field === 'email'
        ? t('security.emailPhone.editEmailVerify')
        : t('security.emailPhone.editPhoneVerify');
      const recordId = await verify({ description });
      setVerificationRecordId(recordId);
      setEditingField(field);
    } catch {
      // User cancelled
    }
  };

  const handleDelete = async () => {
    if (!deleteField) return;
    const field = deleteField;
    setDeleteField(null);
    setError(null);
    setSuccess(null);
    try {
      const description = field === 'email'
        ? t('security.emailPhone.deleteEmailVerify')
        : t('security.emailPhone.deletePhoneVerify');
      const recordId = await verify({ description });
      if (field === 'email') {
        await accountApi.deletePrimaryEmail(recordId);
        setSuccess(t('security.emailPhone.emailDeleted'));
      } else {
        await accountApi.deletePrimaryPhone(recordId);
        setSuccess(t('security.emailPhone.phoneDeleted'));
      }
      onUpdate();
    } catch (err) {
      if (err instanceof Error && err.message !== 'cancelled') {
        setError(err.message);
      }
    }
  };

  const handleSendCode = async () => {
    if (!newValue || !editingField) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await accountApi.sendVerificationCode(editingField, newValue);
      setCodeVerificationId(result.verificationId);
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('security.emailPhone.sendCodeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!verificationRecordId || !codeVerificationId || !newValue || !editingField) return;
    setError(null);
    setIsLoading(true);
    try {
      const codeVerification = await accountApi.verifyCode(
        editingField,
        newValue,
        codeVerificationId,
        verificationCode
      );
      if (editingField === 'email') {
        await accountApi.updatePrimaryEmail(
          newValue,
          verificationRecordId,
          codeVerification.verificationRecordId
        );
        setSuccess(t('security.emailPhone.emailUpdated'));
      } else {
        await accountApi.updatePrimaryPhone(
          newValue,
          verificationRecordId,
          codeVerification.verificationRecordId
        );
        setSuccess(t('security.emailPhone.phoneUpdated'));
      }
      resetForm();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('security.emailPhone.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFieldLabel = deleteField === 'email'
    ? t('security.emailPhone.deleteEmailLabel')
    : t('security.emailPhone.deletePhoneLabel');
  const deleteFieldValue = deleteField === 'email'
    ? profile.primaryEmail
    : profile.primaryPhone ? formatPhone(profile.primaryPhone) : '';
  const deleteTitle = deleteField === 'email'
    ? t('security.emailPhone.deleteEmailTitle')
    : t('security.emailPhone.deletePhoneTitle');

  return (
    <div className="space-y-3">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Email */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-white rounded-lg text-primary-600 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t('security.emailPhone.emailLabel')}</p>
            <p className="font-medium text-gray-900 truncate">
              {profile.primaryEmail || <span className="text-gray-400">{t('security.emailPhone.notSet')}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => handleStartEdit('email')}
            className="p-2.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-white active:bg-gray-100 transition-colors"
            aria-label={t('security.emailPhone.editAriaEmail')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          {profile.primaryEmail && (
            <button
              onClick={() => setDeleteField('email')}
              className="p-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white active:bg-red-50 transition-colors"
              aria-label={t('security.emailPhone.deleteAriaEmail')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Email Edit Form */}
      {editingField === 'email' && verificationRecordId && (
        <EditForm
          field="email"
          newValue={newValue}
          onNewValueChange={setNewValue}
          verificationCode={verificationCode}
          onVerificationCodeChange={setVerificationCode}
          codeSent={codeSent}
          isLoading={isLoading}
          onSendCode={handleSendCode}
          onVerifyAndUpdate={handleVerifyAndUpdate}
          onCancel={resetForm}
        />
      )}

      {/* Phone */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-white rounded-lg text-primary-600 flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t('security.emailPhone.phoneLabel')}</p>
            <p className="font-medium text-gray-900 truncate">
              {profile.primaryPhone ? formatPhone(profile.primaryPhone) : <span className="text-gray-400">{t('security.emailPhone.notSet')}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => handleStartEdit('phone')}
            className="p-2.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-white active:bg-gray-100 transition-colors"
            aria-label={t('security.emailPhone.editAriaPhone')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          {profile.primaryPhone && (
            <button
              onClick={() => setDeleteField('phone')}
              className="p-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white active:bg-red-50 transition-colors"
              aria-label={t('security.emailPhone.deleteAriaPhone')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Phone Edit Form */}
      {editingField === 'phone' && verificationRecordId && (
        <EditForm
          field="phone"
          newValue={newValue}
          onNewValueChange={setNewValue}
          verificationCode={verificationCode}
          onVerificationCodeChange={setVerificationCode}
          codeSent={codeSent}
          isLoading={isLoading}
          onSendCode={handleSendCode}
          onVerifyAndUpdate={handleVerifyAndUpdate}
          onCancel={resetForm}
        />
      )}

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteField} onClose={() => setDeleteField(null)} title={deleteField ? deleteTitle : ''}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('security.emailPhone.deleteConfirm', { fieldLabel: deleteFieldLabel, value: deleteFieldValue })}
          </p>
          <div className="flex gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteField(null)} className="flex-1 sm:flex-none">
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1 sm:flex-none">
              {t('security.emailPhone.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface EditFormProps {
  field: FieldType;
  newValue: string;
  onNewValueChange: (value: string) => void;
  verificationCode: string;
  onVerificationCodeChange: (value: string) => void;
  codeSent: boolean;
  isLoading: boolean;
  onSendCode: () => void;
  onVerifyAndUpdate: () => void;
  onCancel: () => void;
}

function EditForm({
  field,
  newValue,
  onNewValueChange,
  verificationCode,
  onVerificationCodeChange,
  codeSent,
  isLoading,
  onSendCode,
  onVerifyAndUpdate,
  onCancel,
}: EditFormProps) {
  const { t } = useTranslation();

  const editTitle = field === 'email'
    ? t('security.emailPhone.editEmailTitle')
    : t('security.emailPhone.editPhoneTitle');
  const inputLabel = field === 'email'
    ? t('security.emailPhone.newEmailLabel')
    : t('security.emailPhone.newPhoneLabel');

  return (
    <div className="p-4 border border-primary-200 bg-primary-50/50 rounded-lg space-y-4">
      <h4 className="font-medium text-gray-900 text-sm">{editTitle}</h4>

      {!codeSent ? (
        <>
          {field === 'phone' ? (
            <PhoneInput
              label={inputLabel}
              value={newValue}
              onChange={onNewValueChange}
              placeholder={t('security.emailPhone.phonePlaceholder')}
            />
          ) : (
            <Input
              label={inputLabel}
              type="email"
              value={newValue}
              onChange={(e) => onNewValueChange(e.target.value)}
              placeholder={t('security.emailPhone.emailPlaceholder')}
            />
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">{t('common.cancel')}</Button>
            <Button onClick={onSendCode} loading={isLoading} disabled={!newValue} className="flex-1 sm:flex-none">
              {t('security.emailPhone.sendCode')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Alert type="info">{t('security.emailPhone.codeSentTo', { target: newValue })}</Alert>
          <Input
            label={t('security.emailPhone.verificationCode')}
            value={verificationCode}
            onChange={(e) => onVerificationCodeChange(e.target.value)}
            placeholder={t('security.emailPhone.codePlaceholder')}
            maxLength={6}
            autoFocus
            inputMode="numeric"
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">{t('common.cancel')}</Button>
            <Button
              onClick={onVerifyAndUpdate}
              loading={isLoading}
              disabled={!verificationCode}
              className="flex-1 sm:flex-none"
            >
              {t('security.emailPhone.verifyAndUpdate')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
