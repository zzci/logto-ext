import { useState, useRef, memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
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
}

interface CollapsibleCardProps {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// Move CollapsibleCard outside and memoize it to prevent state reset on parent re-render
const CollapsibleCard = memo(function CollapsibleCard({
  title,
  description,
  defaultOpen = false,
  children
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasBeenOpened = useRef(defaultOpen);

  if (isOpen && !hasBeenOpened.current) {
    hasBeenOpened.current = true;
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="text-gray-400">
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </CardHeader>
      <div className={cn(!isOpen && 'hidden')}>
        {hasBeenOpened.current && <CardContent>{children}</CardContent>}
      </div>
    </Card>
  );
});

// Memoize ChangePasswordForm to prevent unnecessary re-renders
const MemoizedChangePasswordForm = memo(ChangePasswordForm);

export function AccountCenter({ activeTab }: AccountCenterProps) {
  const { profile, isLoading, error, refetch } = useAccount();

  // Store hasPassword in a ref to prevent re-renders from changing props
  const hasPasswordRef = useRef<boolean | null>(null);
  if (profile && hasPasswordRef.current === null) {
    hasPasswordRef.current = profile.hasPassword;
  }

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">加载失败: {error.message}</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const hasPassword = hasPasswordRef.current ?? profile.hasPassword;

  return (
    <div className="w-full">
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>个人资料</CardTitle>
            <CardDescription>管理您的个人信息和公开资料</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <CollapsibleCard
            title="邮箱与手机"
            description="管理用于登录和接收通知的联系方式"
          >
            <EmailPhoneSettings profile={profile} onUpdate={refetch} />
          </CollapsibleCard>

          <CollapsibleCard
            title={hasPassword ? '修改密码' : '设置密码'}
            description={
              hasPassword
                ? '定期更换密码可以提高账户安全性'
                : '您的账户尚未设置密码，设置密码后可以使用密码登录'
            }
            defaultOpen
          >
            <MemoizedChangePasswordForm
              hasPassword={hasPassword}
              onSuccess={refetch}
            />
          </CollapsibleCard>

          <CollapsibleCard
            title="双因素认证 (2FA)"
            description="启用双因素认证可以大幅提升账户安全性，即使密码泄露也能保护您的账户"
          >
            <MfaSettings />
          </CollapsibleCard>
        </div>
      )}

      {activeTab === 'connections' && (
        <Card>
          <CardHeader>
            <CardTitle>关联账号</CardTitle>
            <CardDescription>
              管理已关联的第三方账号，您可以使用这些账号快速登录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedAccounts profile={profile} onUpdate={refetch} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <SettingsContent profile={profile} />
      )}
    </div>
  );
}
