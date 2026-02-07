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
  }

  // Only show loading spinner on initial load, not during token refresh
  if (isLoading && !wasAuthenticated.current) {
    return <Spinner />;
  }

  // Auto-redirect to login when not authenticated
  if (!isAuthenticated && !wasAuthenticated.current) {
    const appConfig = getAppConfig();
    return <RedirectToSignIn signIn={() => signIn(appConfig.baseUrl + '/user/callback')} />;
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

/**
 * Triggers signIn redirect exactly once, showing a spinner while redirecting.
 * Uses a module-level flag to survive React StrictMode's double-mount cycle.
 */
let redirecting = false;
function RedirectToSignIn({ signIn }: { signIn: () => Promise<void> }) {
  const called = useRef(false);
  if (!called.current && !redirecting) {
    called.current = true;
    redirecting = true;
    void signIn().catch(() => {
      redirecting = false;
    });
  }
  return <Spinner />;
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
