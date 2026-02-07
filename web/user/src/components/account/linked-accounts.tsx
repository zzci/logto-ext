import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Unlink, Plus } from 'lucide-react';
import { Button, Alert, Modal } from '@/components/ui';
import { useVerificationStore } from '@/stores';
import { accountApi } from '@/services';
import i18n from '@/i18n';
import type { UserProfile, SocialConnector } from '@/types';

interface LinkedAccountsProps {
  profile: UserProfile;
  onUpdate: () => void;
}

const socialProviderDefs = {
  google: { nameKey: 'connections.socialProviders.google' as const, icon: '🔍', color: 'bg-red-50 text-red-600' },
  github: { nameKey: 'connections.socialProviders.github' as const, icon: '🐙', color: 'bg-gray-50 text-gray-800' },
  wechat: { nameKey: 'connections.socialProviders.wechat' as const, icon: '💬', color: 'bg-green-50 text-green-600' },
  apple: { nameKey: 'connections.socialProviders.apple' as const, icon: '🍎', color: 'bg-gray-50 text-gray-800' },
  facebook: { nameKey: 'connections.socialProviders.facebook' as const, icon: '📘', color: 'bg-blue-50 text-blue-600' },
  discord: { nameKey: 'connections.socialProviders.discord' as const, icon: '🎮', color: 'bg-indigo-50 text-indigo-600' },
  microsoft: { nameKey: 'connections.socialProviders.microsoft' as const, icon: '🪟', color: 'bg-blue-50 text-blue-600' },
  alipay: { nameKey: 'connections.socialProviders.alipay' as const, icon: '💰', color: 'bg-blue-50 text-blue-600' },
  weibo: { nameKey: 'connections.socialProviders.weibo' as const, icon: '📱', color: 'bg-red-50 text-red-600' },
} as const;

export function LinkedAccounts({ profile, onUpdate }: LinkedAccountsProps) {
  const { t } = useTranslation();
  const verify = useVerificationStore((s) => s.verify);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [availableConnectors, setAvailableConnectors] = useState<SocialConnector[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(true);

  // Unlink confirmation
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);

  const identities = Object.entries(profile.identities || {});
  const linkedTargets = identities.map(([target]) => target.toLowerCase());

  useEffect(() => {
    accountApi.getSocialConnectors()
      .then((connectors) => {
        setAvailableConnectors(
          connectors.filter((c) => c.platform !== null || (c.target !== 'email' && c.target !== 'sms'))
        );
      })
      .catch((err) => console.error('Failed to load connectors:', err))
      .finally(() => setLoadingConnectors(false));
  }, []);

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    const target = unlinkTarget;
    setUnlinkTarget(null);
    setError(null);
    setSuccess(null);
    try {
      const recordId = await verify({ description: t('connections.unlinkVerify') });
      setActionTarget(target);
      setIsLoading(true);
      await accountApi.unlinkSocialIdentity(target, recordId);
      setSuccess(t('connections.unlinkSuccess'));
      onUpdate();
    } catch (err) {
      if (err instanceof Error && err.message !== 'cancelled') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      setActionTarget(null);
    }
  };

  const handleLink = async (connector: SocialConnector) => {
    setError(null);
    setSuccess(null);
    try {
      const recordId = await verify({ description: t('connections.linkVerify') });
      setActionTarget(connector.id);
      setIsLoading(true);

      const state = crypto.randomUUID();
      const redirectUri = `${window.location.origin}/user/callback/social`;

      sessionStorage.setItem('social_link_state', state);
      sessionStorage.setItem('social_link_connector', connector.id);
      sessionStorage.setItem('social_link_verification', recordId);

      const result = await accountApi.startSocialLinking(connector.id, redirectUri, state);
      sessionStorage.setItem('social_link_verification_id', result.verificationId);

      window.location.href = result.authorizationUri;
    } catch (err) {
      if (err instanceof Error && err.message !== 'cancelled') {
        setError(err.message);
      }
      setIsLoading(false);
      setActionTarget(null);
    }
  };

  const getProviderInfo = (target: string) => {
    const key = target.toLowerCase() as keyof typeof socialProviderDefs;
    const def = socialProviderDefs[key];
    if (def) {
      return { name: t(def.nameKey), icon: def.icon, color: def.color };
    }
    return { name: target, icon: '🔗', color: 'bg-gray-50 text-gray-600' };
  };

  const getConnectorName = (connector: SocialConnector) => {
    const lang = i18n.language === 'zh-CN' ? 'zh-CN' : 'en';
    return connector.name[lang] || connector.name['zh-CN'] || connector.name['en'] || connector.target;
  };

  const unlinkedConnectors = availableConnectors.filter(
    (c) => !linkedTargets.includes(c.target.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Linked accounts */}
      {identities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('connections.linked')}</h4>
          {identities.map(([target, identity]) => {
            const provider = getProviderInfo(target);
            return (
              <div
                key={target}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${provider.color}`}>
                    {provider.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{provider.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {identity.userId.slice(0, 16)}...
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnlinkTarget(target)}
                  loading={isLoading && actionTarget === target}
                  className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                >
                  <Unlink className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t('connections.unlink')}</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available connectors to link */}
      {!loadingConnectors && unlinkedConnectors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('connections.available')}</h4>
          <div className="space-y-2">
            {unlinkedConnectors.map((connector) => {
              const provider = getProviderInfo(connector.target);
              return (
                <button
                  key={connector.id}
                  onClick={() => handleLink(connector)}
                  disabled={isLoading}
                  className="flex items-center gap-3 w-full p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100 transition-colors text-left disabled:opacity-50"
                >
                  {connector.logo ? (
                    <img
                      src={connector.logo}
                      alt={getConnectorName(connector)}
                      className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${provider.color}`}>
                      {provider.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{getConnectorName(connector)}</p>
                    <p className="text-xs text-gray-500">{t('connections.clickToLink')}</p>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loadingConnectors && (
        <div className="text-center py-4 text-sm text-gray-500">{t('common.loading')}</div>
      )}

      {identities.length === 0 && !loadingConnectors && unlinkedConnectors.length === 0 && (
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <Link2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{t('connections.noConnectors')}</p>
          <p className="text-xs text-gray-500">{t('connections.contactAdmin')}</p>
        </div>
      )}

      {/* Unlink Confirmation */}
      <Modal isOpen={!!unlinkTarget} onClose={() => setUnlinkTarget(null)} title={t('connections.unlinkTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('connections.unlinkConfirm', { name: unlinkTarget ? getProviderInfo(unlinkTarget).name : '' })}
          </p>
          <div className="flex gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setUnlinkTarget(null)} className="flex-1 sm:flex-none">
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleUnlink} className="flex-1 sm:flex-none">
              {t('connections.confirmUnlink')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
