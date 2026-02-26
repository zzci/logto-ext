import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Select, Alert } from '@/components/ui';
import { useAccount } from '@/hooks';
import { formatDate } from '@/lib/utils';
import i18n from '@/i18n';
import { mapLocaleToLanguage } from '@/i18n';
import type { UserProfile } from '@/types/account';

interface SettingsContentProps {
  profile: UserProfile;
  onSignOut: () => void;
}

export function SettingsContent({ profile, onSignOut }: SettingsContentProps) {
  const { t } = useTranslation();
  const { updateExtendedProfile, isUpdating } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [locale, setLocale] = useState(profile.profile?.locale || '');
  const [zoneinfo, setZoneinfo] = useState(profile.profile?.zoneinfo || '');

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      await updateExtendedProfile({
        locale: locale || undefined,
        zoneinfo: zoneinfo || undefined,
      });
      // Sync i18n language after saving locale preference
      const lang = mapLocaleToLanguage(locale);
      if (lang) {
        i18n.changeLanguage(lang);
      }
      setSuccess(t('settings.saveSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.saveFailed'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferencesTitle')}</CardTitle>
          <CardDescription>{t('settings.preferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && <Alert type="success">{success}</Alert>}
          {error && <Alert type="error">{error}</Alert>}

          <Select
            label={t('settings.language')}
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={isUpdating}
          >
            <option value="">{t('settings.languageOptions.system')}</option>
            <option value="zh-CN">{t('settings.languageOptions.zhCN')}</option>
            <option value="zh-TW">{t('settings.languageOptions.zhTW')}</option>
            <option value="en-US">{t('settings.languageOptions.enUS')}</option>
            <option value="en-GB">{t('settings.languageOptions.enGB')}</option>
            <option value="ja">{t('settings.languageOptions.ja')}</option>
            <option value="ko">{t('settings.languageOptions.ko')}</option>
          </Select>

          <Select
            label={t('settings.timezone')}
            value={zoneinfo}
            onChange={(e) => setZoneinfo(e.target.value)}
            disabled={isUpdating}
          >
            <option value="">{t('settings.timezoneOptions.system')}</option>
            <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
            <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
            <option value="Europe/London">Europe/London (UTC+0)</option>
            <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
          </Select>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={isUpdating}>
              {t('settings.saveSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.accountInfoTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">{t('settings.accountId')}</dt>
              <dd className="text-sm font-mono text-gray-900 truncate ml-4">{profile.id}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">{t('settings.createdAt')}</dt>
              <dd className="text-sm text-gray-900">{formatDate(profile.createdAt)}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-500">{t('settings.updatedAt')}</dt>
              <dd className="text-sm text-gray-900">{formatDate(profile.updatedAt)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-sm text-gray-500">{t('settings.accountStatus')}</dt>
              <dd>
                {profile.isSuspended ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {t('settings.suspended')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('settings.active')}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t('auth.logout')}
      </button>
    </div>
  );
}
