import { useState, useRef, useCallback, useEffect } from 'react';
import { LogtoProvider, useLogto } from '@logto/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getLogtoConfig, getAppConfig } from '@/lib/config';
import { CallbackPage, SocialCallbackPage } from '@/pages';
import { AccountLayout } from '@/components/layout';
import { AccountCenter } from '@/components/account';
import { PasswordVerificationModal } from '@/components/account/password-verification-modal';
import { Spinner } from '@/components/ui';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type TabId = 'profile' | 'security' | 'connections' | 'settings';

const validTabs: TabId[] = ['profile', 'security', 'connections', 'settings'];

function getTabFromHash(): TabId {
  const hash = window.location.hash.slice(1);
  return validTabs.includes(hash as TabId) ? (hash as TabId) : 'profile';
}

// Module-level flag to prevent duplicate signIn calls (survives StrictMode remount)
let signInTriggered = false;

function AccountApp() {
  const { isAuthenticated, isLoading, signIn, signOut } = useLogto();
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

  // Sync tab when user navigates with browser back/forward
  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Track if user was ever authenticated in this session.
  // This prevents the entire component tree from unmounting during
  // token refresh (isLoading briefly flips to true), which would
  // destroy all form state.
  const wasAuthenticated = useRef(false);
  if (isAuthenticated) {
    wasAuthenticated.current = true;
    signInTriggered = false;
  }

  // Auto-redirect to login when not authenticated
  useEffect(() => {
    if (!isAuthenticated && !wasAuthenticated.current && !isLoading && !signInTriggered) {
      signInTriggered = true;
      const appConfig = getAppConfig();
      void signIn(appConfig.baseUrl + '/user/callback').catch((err) => {
        signInTriggered = false;
        console.error('[AccountApp] signIn redirect failed:', err);
      });
    }
  }, [isAuthenticated, isLoading, signIn]);

  // Show spinner during initial load or while redirecting to login
  if ((isLoading || !isAuthenticated) && !wasAuthenticated.current) {
    return <Spinner />;
  }

  const handleSignOut = () => {
    const appConfig = getAppConfig();
    wasAuthenticated.current = false;
    signOut(appConfig.baseUrl + '/user');
  };

  return (
    <AccountLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <AccountCenter activeTab={activeTab} onSignOut={handleSignOut} />
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
    <LogtoProvider config={getLogtoConfig()}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/user">
          <AppRoutes />
          <PasswordVerificationModal />
        </BrowserRouter>
      </QueryClientProvider>
    </LogtoProvider>
  );
}

export default App;
