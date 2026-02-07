import { useState, useEffect } from 'react';
import { Link2, Unlink, Plus } from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import { PasswordVerificationModal } from './password-verification-modal';
import { useVerification } from '@/hooks';
import { accountApi } from '@/services';
import type { SocialConnector } from '@/services/account-api';
import type { UserProfile } from '@/types';

interface LinkedAccountsProps {
  profile: UserProfile;
  onUpdate: () => void;
}

// Common social provider icons and names
const socialProviders: Record<string, { name: string; icon: string; color: string }> = {
  google: { name: 'Google', icon: '🔍', color: 'bg-red-50 text-red-600' },
  github: { name: 'GitHub', icon: '🐙', color: 'bg-gray-50 text-gray-800' },
  wechat: { name: '微信', icon: '💬', color: 'bg-green-50 text-green-600' },
  apple: { name: 'Apple', icon: '🍎', color: 'bg-gray-50 text-gray-800' },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-50 text-blue-600' },
  discord: { name: 'Discord', icon: '🎮', color: 'bg-indigo-50 text-indigo-600' },
  microsoft: { name: 'Microsoft', icon: '🪟', color: 'bg-blue-50 text-blue-600' },
  alipay: { name: '支付宝', icon: '💰', color: 'bg-blue-50 text-blue-600' },
  weibo: { name: '微博', icon: '📱', color: 'bg-red-50 text-red-600' },
};

export function LinkedAccounts({ profile, onUpdate }: LinkedAccountsProps) {
  const { verifyPassword } = useVerification();

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<SocialConnector | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableConnectors, setAvailableConnectors] = useState<SocialConnector[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(true);

  const identities = Object.entries(profile.identities || {});
  const linkedTargets = identities.map(([target]) => target.toLowerCase());

  // Load available social connectors
  useEffect(() => {
    async function loadConnectors() {
      try {
        const connectors = await accountApi.getSocialConnectors();
        // Filter to only social connectors (not email/sms)
        const socialConnectors = connectors.filter(
          (c) => c.platform !== null || (c.target !== 'email' && c.target !== 'sms')
        );
        setAvailableConnectors(socialConnectors);
      } catch (err) {
        console.error('Failed to load connectors:', err);
      } finally {
        setLoadingConnectors(false);
      }
    }
    loadConnectors();
  }, []);

  const handleUnlink = (identityId: string) => {
    setUnlinkTarget(identityId);
    setLinkTarget(null);
    setShowVerifyModal(true);
  };

  const handleLink = (connector: SocialConnector) => {
    setLinkTarget(connector);
    setUnlinkTarget(null);
    setShowVerifyModal(true);
  };

  const handleVerifyAndAction = async (password: string) => {
    const recordId = await verifyPassword(password);
    setShowVerifyModal(false);

    if (unlinkTarget) {
      // Unlink flow
      setIsLoading(true);
      try {
        await accountApi.unlinkSocialIdentity(unlinkTarget, recordId);
        onUpdate();
      } catch (err) {
        setError(err instanceof Error ? err.message : '解绑失败');
      } finally {
        setIsLoading(false);
        setUnlinkTarget(null);
      }
    } else if (linkTarget) {
      // Link flow - redirect to social provider
      setIsLoading(true);
      try {
        const state = crypto.randomUUID();
        const redirectUri = `${window.location.origin}/user/callback/social`;

        // Store state for callback verification
        sessionStorage.setItem('social_link_state', state);
        sessionStorage.setItem('social_link_connector', linkTarget.id);
        sessionStorage.setItem('social_link_verification', recordId);

        const result = await accountApi.startSocialLinking(
          linkTarget.id,
          redirectUri,
          state
        );

        // Store verification record ID for binding after callback
        sessionStorage.setItem('social_link_verification_record', result.verificationRecordId);

        // Redirect to social provider
        window.location.href = result.authorizationUri;
      } catch (err) {
        setError(err instanceof Error ? err.message : '关联失败');
        setIsLoading(false);
        setLinkTarget(null);
      }
    }
  };

  const getProviderInfo = (target: string) => {
    const key = target.toLowerCase();
    return socialProviders[key] || { name: target, icon: '🔗', color: 'bg-gray-50 text-gray-600' };
  };

  const getConnectorName = (connector: SocialConnector) => {
    return connector.name['zh-CN'] || connector.name['en'] || connector.target;
  };

  // Filter out already linked connectors
  const unlinkedConnectors = availableConnectors.filter(
    (c) => !linkedTargets.includes(c.target.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}

      {/* Linked accounts */}
      {identities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">已关联账号</h4>
          {identities.map(([target, identity]) => {
            const provider = getProviderInfo(target);
            return (
              <div
                key={target}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${provider.color}`}>
                    {provider.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{provider.name}</p>
                    <p className="text-sm text-gray-500">
                      ID: {identity.userId.slice(0, 16)}...
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink(target)}
                  loading={isLoading && unlinkTarget === target}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  解绑
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available connectors to link */}
      {!loadingConnectors && unlinkedConnectors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">可关联账号</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlinkedConnectors.map((connector) => {
              const provider = getProviderInfo(connector.target);
              return (
                <button
                  key={connector.id}
                  onClick={() => handleLink(connector)}
                  disabled={isLoading}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-left disabled:opacity-50"
                >
                  {connector.logo ? (
                    <img
                      src={connector.logo}
                      alt={getConnectorName(connector)}
                      className="w-10 h-10 rounded-lg object-contain"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${provider.color}`}>
                      {provider.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{getConnectorName(connector)}</p>
                    <p className="text-sm text-gray-500">点击关联</p>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loadingConnectors && (
        <div className="text-center py-4 text-gray-500">加载可用连接器...</div>
      )}

      {identities.length === 0 && !loadingConnectors && unlinkedConnectors.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Link2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无可用的社交登录</h3>
          <p className="text-sm text-gray-500">
            请联系管理员配置社交登录连接器
          </p>
        </div>
      )}

      <PasswordVerificationModal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setUnlinkTarget(null);
          setLinkTarget(null);
        }}
        onVerify={handleVerifyAndAction}
        title="验证身份"
        description={
          unlinkTarget
            ? '解绑社交账号需要验证您的身份'
            : '关联社交账号需要验证您的身份'
        }
      />
    </div>
  );
}
