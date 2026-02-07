import { User, Shield, Link2, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'profile' | 'security' | 'connections' | 'settings';

interface Tab {
  id: TabId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const tabs: Tab[] = [
  { id: 'profile', icon: User, label: '个人资料' },
  { id: 'security', icon: Shield, label: '安全设置' },
  { id: 'connections', icon: Link2, label: '关联账号' },
  { id: 'settings', icon: Settings, label: '偏好设置' },
];

interface AccountLayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function AccountLayout({ activeTab, onTabChange, onSignOut, children }: AccountLayoutProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">账户中心</h1>
        <p className="text-sm text-gray-500 mt-1">管理您的账户信息和安全设置</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={onSignOut}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
