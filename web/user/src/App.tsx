import { useState } from 'react';
import { LogtoProvider, useLogto } from '@logto/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { logtoConfig, appConfig } from '@/lib/config';
import { CallbackPage, SocialCallbackPage } from '@/pages';
import { AccountLayout } from '@/components/layout';
import { AccountCenter } from '@/components/account';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type TabId = 'profile' | 'security' | 'connections' | 'settings';

function AccountApp() {
  const { isAuthenticated, isLoading, signIn, signOut } = useLogto();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录以访问账户中心</p>
          <button
            onClick={() => signIn(appConfig.baseUrl + '/user/callback')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut(appConfig.baseUrl + '/user');
  };

  return (
    <AccountLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={handleSignOut}
    >
      <AccountCenter activeTab={activeTab} />
    </AccountLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/callback/social" element={<SocialCallbackPage />} />
      <Route path="*" element={<AccountApp />} />
    </Routes>
  );
}

function App() {
  return (
    <LogtoProvider config={logtoConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/user">
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </LogtoProvider>
  );
}

export default App;
