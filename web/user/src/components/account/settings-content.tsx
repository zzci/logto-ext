import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Alert } from '@/components/ui';
import { useAccount } from '@/hooks';
import { formatDate } from '@/lib/utils';
import type { UserProfile } from '@/types/account';

interface SettingsContentProps {
  profile: UserProfile;
}

export function SettingsContent({ profile }: SettingsContentProps) {
  const { updateExtendedProfile, isUpdating } = useAccount();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [locale, setLocale] = useState(profile.profile?.locale || '');
  const [zoneinfo, setZoneinfo] = useState(profile.profile?.zoneinfo || '');

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    try {
      await updateExtendedProfile({
        locale: locale || undefined,
        zoneinfo: zoneinfo || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>偏好设置</CardTitle>
          <CardDescription>设置您的语言和时区偏好</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">设置已保存</Alert>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              语言
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">跟随系统</option>
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时区
            </label>
            <select
              value={zoneinfo}
              onChange={(e) => setZoneinfo(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">跟随系统</option>
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={isUpdating}>
              保存设置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>您的账户详细信息</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">账户 ID</dt>
              <dd className="text-sm font-mono text-gray-900">{profile.id}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">注册时间</dt>
              <dd className="text-sm text-gray-900">{formatDate(profile.createdAt)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">最后更新</dt>
              <dd className="text-sm text-gray-900">{formatDate(profile.updatedAt)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-gray-500">账户状态</dt>
              <dd>
                {profile.isSuspended ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    已停用
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    正常
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
