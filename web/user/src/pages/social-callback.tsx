import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui';
import { accountApi } from '@/services';

export function SocialCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get stored state
        const storedState = sessionStorage.getItem('social_link_state');
        const connectorId = sessionStorage.getItem('social_link_connector');
        const passwordVerificationId = sessionStorage.getItem('social_link_verification');
        const socialVerificationId = sessionStorage.getItem('social_link_verification_id');

        // Get callback params
        const state = searchParams.get('state');
        const code = searchParams.get('code');

        // Verify state
        if (!storedState || storedState !== state) {
          throw new Error('State mismatch - possible CSRF attack');
        }

        if (!connectorId || !socialVerificationId || !passwordVerificationId) {
          throw new Error('Missing session data');
        }

        if (!code) {
          const errorDesc = searchParams.get('error_description') || searchParams.get('error');
          throw new Error(errorDesc || 'Authorization failed');
        }

        // Build callback data from all search params
        const callbackData: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          callbackData[key] = value;
        });

        // Verify social identity using social verification ID
        const verifyResult = await accountApi.verifySocialIdentity(
          connectorId,
          socialVerificationId,
          callbackData
        );

        // Bind social identity using password verification as identity proof
        await accountApi.bindSocialIdentity(
          passwordVerificationId,
          verifyResult.verificationRecordId
        );

        // Clean up session storage
        sessionStorage.removeItem('social_link_state');
        sessionStorage.removeItem('social_link_connector');
        sessionStorage.removeItem('social_link_verification');
        sessionStorage.removeItem('social_link_verification_id');

        setStatus('success');

        // Redirect to connections page
        setTimeout(() => {
          navigate('/connections', { replace: true });
        }, 1500);
      } catch (err) {
        console.error('Social callback error:', err);
        setError(err instanceof Error ? err.message : t('connections.linkFailed'));
        setStatus('error');

        // Clean up session storage on error too
        sessionStorage.removeItem('social_link_state');
        sessionStorage.removeItem('social_link_connector');
        sessionStorage.removeItem('social_link_verification');
        sessionStorage.removeItem('social_link_verification_id');
      }
    }

    handleCallback();
  }, [navigate, searchParams, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        {status === 'processing' && (
          <>
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('connections.callback.linking')}</h2>
            <p className="text-gray-500">{t('connections.callback.pleaseWait')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('connections.callback.linkSuccess')}</h2>
            <p className="text-gray-500">{t('connections.callback.redirecting')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert type="error" className="mb-4">{error}</Alert>
            <button
              onClick={() => navigate('/connections', { replace: true })}
              className="text-primary-600 hover:underline"
            >
              {t('connections.callback.backToConnections')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
