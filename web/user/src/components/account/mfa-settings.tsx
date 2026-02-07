import { useState } from 'react';
import { Shield, Smartphone, Key, Trash2, Plus } from 'lucide-react';
import { Button, Alert, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { PasswordVerificationModal } from './password-verification-modal';
import { useMfa, useVerification } from '@/hooks';
import type { MfaVerification } from '@/types';

export function MfaSettings() {
  const { mfaVerifications, isLoading, createTotp, verifyTotp, deleteMfa, generateBackupCodes } =
    useMfa();
  const { verifyPassword } = useVerification();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationRecordId, setVerificationRecordId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'add-totp' | 'delete' | 'backup' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // TOTP setup state
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    qrCode: string;
    verificationId: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const handleVerifyAndAction = async (password: string) => {
    const recordId = await verifyPassword(password);
    setVerificationRecordId(recordId);
    setShowVerifyModal(false);

    if (pendingAction === 'add-totp') {
      const result = await createTotp(recordId);
      setTotpSetup({
        secret: result.secret,
        qrCode: result.secretQrCode,
        verificationId: result.verificationId,
      });
    } else if (pendingAction === 'delete' && deleteTarget) {
      await deleteMfa({ id: deleteTarget, verificationRecordId: recordId });
      setDeleteTarget(null);
    } else if (pendingAction === 'backup') {
      const result = await generateBackupCodes(recordId);
      setBackupCodes(result.codes);
    }

    setPendingAction(null);
  };

  const handleAddTotp = () => {
    setPendingAction('add-totp');
    setShowVerifyModal(true);
  };

  const handleVerifyTotp = async () => {
    if (!verificationRecordId || !totpCode) return;
    setError(null);

    try {
      await verifyTotp({ code: totpCode, verificationRecordId });
      setTotpSetup(null);
      setTotpCode('');
      setVerificationRecordId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码错误');
    }
  };

  const handleDeleteMfa = (id: string) => {
    setDeleteTarget(id);
    setPendingAction('delete');
    setShowVerifyModal(true);
  };

  const handleGenerateBackupCodes = () => {
    setPendingAction('backup');
    setShowVerifyModal(true);
  };

  const getMfaIcon = (type: MfaVerification['type']) => {
    switch (type) {
      case 'Totp':
        return <Smartphone className="w-5 h-5" />;
      case 'BackupCode':
        return <Key className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getMfaLabel = (type: MfaVerification['type']) => {
    switch (type) {
      case 'Totp':
        return '身份验证器应用';
      case 'BackupCode':
        return '备用验证码';
      case 'WebAuthn':
        return 'WebAuthn / 安全密钥';
      default:
        return type;
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const hasTotpEnabled = mfaVerifications.some((m) => m.type === 'Totp');

  return (
    <div className="space-y-6">
      {/* Current MFA Methods */}
      {mfaVerifications.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">已启用的验证方式</h4>
          {mfaVerifications.map((mfa) => (
            <div
              key={mfa.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-primary-600">
                  {getMfaIcon(mfa.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getMfaLabel(mfa.type)}</p>
                  <p className="text-sm text-gray-500">
                    添加于 {new Date(mfa.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMfa(mfa.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* TOTP Setup */}
      {totpSetup ? (
        <Card>
          <CardHeader>
            <CardTitle>设置身份验证器应用</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                使用 Google Authenticator、Microsoft Authenticator 或其他兼容的应用扫描此二维码
              </p>
              <img
                src={totpSetup.qrCode}
                alt="TOTP QR Code"
                className="mx-auto w-48 h-48 border rounded-lg"
              />
              <p className="mt-4 text-sm text-gray-500">
                或手动输入密钥：<code className="bg-gray-100 px-2 py-1 rounded">{totpSetup.secret}</code>
              </p>
            </div>

            <Input
              label="验证码"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="输入6位验证码"
              maxLength={6}
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setTotpSetup(null)}>
                取消
              </Button>
              <Button onClick={handleVerifyTotp} disabled={totpCode.length !== 6}>
                验证并启用
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {!hasTotpEnabled && (
            <button
              onClick={handleAddTotp}
              className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">添加身份验证器应用</p>
                <p className="text-sm text-gray-500">使用 TOTP 应用生成一次性验证码</p>
              </div>
              <Plus className="w-5 h-5 ml-auto text-gray-400" />
            </button>
          )}

          <button
            onClick={handleGenerateBackupCodes}
            className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
          >
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">生成备用验证码</p>
              <p className="text-sm text-gray-500">用于无法使用其他验证方式时恢复账户</p>
            </div>
            <Plus className="w-5 h-5 ml-auto text-gray-400" />
          </button>
        </div>
      )}

      {/* Backup Codes Display */}
      {backupCodes && (
        <Card>
          <CardHeader>
            <CardTitle>您的备用验证码</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert type="warning">
              请妥善保存这些验证码，每个验证码只能使用一次。关闭此窗口后将无法再次查看。
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  {code}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setBackupCodes(null)}>
              我已保存，关闭
            </Button>
          </CardContent>
        </Card>
      )}

      <PasswordVerificationModal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setPendingAction(null);
          setDeleteTarget(null);
        }}
        onVerify={handleVerifyAndAction}
        title="验证身份"
        description="修改双因素认证设置需要验证您的身份"
      />
    </div>
  );
}
