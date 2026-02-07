import { useState } from 'react';
import { Mail, Phone, Pencil, Trash2 } from 'lucide-react';
// Note: Email is read-only in current Logto configuration
import { Button, Input, Alert } from '@/components/ui';
import { PasswordVerificationModal } from './password-verification-modal';
import { useVerification } from '@/hooks';
import { accountApi } from '@/services';
import type { UserProfile } from '@/types';

interface EmailPhoneSettingsProps {
  profile: UserProfile;
  onUpdate: () => void;
}

export function EmailPhoneSettings({ profile, onUpdate }: EmailPhoneSettingsProps) {
  const { verifyPassword } = useVerification();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationRecordId, setVerificationRecordId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'email' | 'phone' | null>(null);
  const [deleteType, setDeleteType] = useState<'email' | 'phone' | null>(null);

  // Form state
  const [newValue, setNewValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeVerificationId, setCodeVerificationId] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Only phone can be edited (email is read-only)
  const handleStartEdit = () => {
    setEditingType('phone');
    setShowVerifyModal(true);
  };

  const handleStartDelete = () => {
    setDeleteType('phone');
    setShowVerifyModal(true);
  };

  const handleVerifyPassword = async (password: string) => {
    const recordId = await verifyPassword(password);
    setVerificationRecordId(recordId);
    setShowVerifyModal(false);

    if (deleteType) {
      // Perform delete (only phone)
      try {
        await accountApi.deletePrimaryPhone(recordId);
        onUpdate();
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除失败');
      }
      setDeleteType(null);
      setVerificationRecordId(null);
    }
  };

  const handleSendCode = async () => {
    if (!newValue || !editingType) return;
    setError(null);
    setIsLoading(true);

    try {
      const result = await accountApi.sendVerificationCode(editingType, newValue);
      setCodeVerificationId(result.verificationId);
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!verificationRecordId || !codeVerificationId || !newValue || !editingType) return;
    setError(null);
    setIsLoading(true);

    try {
      // Verify the code first
      const codeVerification = await accountApi.verifyCode(
        editingType,
        newValue,
        codeVerificationId,
        verificationCode
      );

      // Update phone (email is read-only)
      await accountApi.updatePrimaryPhone(
        newValue,
        verificationRecordId,
        codeVerification.verificationRecordId
      );

      // Reset state
      handleCancel();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingType(null);
    setDeleteType(null);
    setNewValue('');
    setVerificationCode('');
    setCodeVerificationId(null);
    setCodeSent(false);
    setVerificationRecordId(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      {/* Email Section - Read Only */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-primary-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">邮箱地址 <span className="text-xs text-gray-400">(只读)</span></p>
            <p className="font-medium text-gray-900">
              {profile.primaryEmail || '未设置'}
            </p>
          </div>
        </div>
      </div>

      {/* Phone Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-primary-600">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">手机号码</p>
            <p className="font-medium text-gray-900">
              {profile.primaryPhone || '未设置'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleStartEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          {profile.primaryPhone && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Edit Form - Phone Only */}
      {editingType && verificationRecordId && (
        <div className="p-4 border border-primary-200 bg-primary-50 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">修改手机号码</h4>

          {!codeSent ? (
            <>
              <Input
                type="tel"
                label="新手机号码"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="+86 138 xxxx xxxx"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
                <Button onClick={handleSendCode} loading={isLoading} disabled={!newValue}>
                  发送验证码
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert type="info">
                验证码已发送至 {newValue}，请查收
              </Alert>
              <Input
                label="验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={6}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
                <Button
                  onClick={handleVerifyAndUpdate}
                  loading={isLoading}
                  disabled={!verificationCode}
                >
                  验证并更新
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <PasswordVerificationModal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setEditingType(null);
          setDeleteType(null);
        }}
        onVerify={handleVerifyPassword}
        title="验证身份"
        description={
          deleteType
            ? `删除${deleteType === 'email' ? '邮箱' : '手机号'}需要验证您的身份`
            : `修改${editingType === 'email' ? '邮箱' : '手机号'}需要验证您的身份`
        }
      />
    </div>
  );
}
