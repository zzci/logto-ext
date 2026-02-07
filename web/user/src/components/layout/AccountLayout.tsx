import { User, Shield, Link2, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type TabId = 'profile' | 'security' | 'connections' | 'settings';

const tabDefs = [
  { id: 'profile' as const, icon: User, labelKey: 'layout.tabs.profile' as const },
  { id: 'security' as const, icon: Shield, labelKey: 'layout.tabs.security' as const },
  { id: 'connections' as const, icon: Link2, labelKey: 'layout.tabs.connections' as const },
  { id: 'settings' as const, icon: Settings, labelKey: 'layout.tabs.settings' as const },
];

interface AccountLayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
}

export function AccountLayout({ activeTab, onTabChange, children }: AccountLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        {/* Logo — centered */}
        <div className="flex justify-center py-4">
          <img src="https://gid.io/logo.png" alt="Logo" className="h-8 w-auto" />
        </div>
        {/* Desktop tabs */}
        <nav role="tablist" aria-label={t('layout.accountSettings')} className="hidden sm:flex justify-center gap-1 px-6 pb-3">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        role="tablist"
        aria-label={t('layout.accountSettings')}
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 safe-area-bottom"
      >
        <div className="grid grid-cols-4 h-14">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-mobile-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-gray-400 active:text-gray-600'
              )}
            >
              <tab.icon className="w-5 h-5" />
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
