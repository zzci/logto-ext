import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from '@/components/ui';
import { ProfileForm } from './profile-form';
import { ChangePasswordForm } from './change-password-form';
import { MfaSettings } from './mfa-settings';
import { EmailPhoneSettings } from './email-phone-settings';
import { LinkedAccounts } from './linked-accounts';
import { SettingsContent } from './settings-content';
import { useAccount } from '@/hooks';
import { cn } from '@/lib/utils';

type TabId = 'profile' | 'security' | 'connections' | 'settings';

interface AccountCenterProps {
  activeTab: TabId;
  onSignOut: () => void;
}

interface CollapsibleCardProps {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleCard = memo(function CollapsibleCard({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none active:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription className={cn(isOpen && 'hidden sm:block')}>{description}</CardDescription>
          </div>
          <div className={cn(
            'text-gray-400 transition-transform duration-200 flex-shrink-0',
            isOpen && 'rotate-180'
          )}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </CardHeader>
      <div
        className="collapsible-content"
        data-open={isOpen}
      >
        <div>
          <CardContent>{children}</CardContent>
        </div>
      </div>
    </Card>
  );
});

export function AccountCenter({ activeTab, onSignOut }: AccountCenterProps) {
  const { t } = useTranslation();
  const { profile, isLoading, error, refetch } = useAccount();

  if (isLoading && !profile) {
    return <Spinner />;
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">{t('profile.updateError')}</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full space-y-4">
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <div className="space-y-3">
          <CollapsibleCard
            title={t('security.emailPhone.title')}
            description={t('security.emailPhone.description')}
            defaultOpen
          >
            <EmailPhoneSettings profile={profile} onUpdate={refetch} />
          </CollapsibleCard>

          <CollapsibleCard
            title={profile.hasPassword ? t('security.password.changeTitle') : t('security.password.setTitle')}
            description={
              profile.hasPassword
                ? t('security.password.changeDescription')
                : t('security.password.setDescription')
            }
          >
            <ChangePasswordForm
              hasPassword={profile.hasPassword}
              onSuccess={refetch}
            />
          </CollapsibleCard>

          <CollapsibleCard
            title={t('security.mfa.title')}
            description={t('security.mfa.description')}
          >
            <MfaSettings />
          </CollapsibleCard>
        </div>
      )}

      {activeTab === 'connections' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('connections.title')}</CardTitle>
            <CardDescription>{t('connections.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedAccounts profile={profile} onUpdate={refetch} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <SettingsContent profile={profile} onSignOut={onSignOut} />
      )}
    </div>
  );
}
