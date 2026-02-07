import { useState, useCallback } from 'react';
import { accountApi } from '@/services';

interface VerificationState {
  verificationRecordId: string | null;
  expiresAt: Date | null;
  isVerified: boolean;
}

export function useVerification() {
  const [state, setState] = useState<VerificationState>({
    verificationRecordId: null,
    expiresAt: null,
    isVerified: false,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyPassword = useCallback(async (password: string) => {
    console.log('[useVerification] verifyPassword called');
    setIsVerifying(true);
    setError(null);
    try {
      console.log('[useVerification] Calling accountApi.verifyPassword...');
      const response = await accountApi.verifyPassword(password);
      console.log('[useVerification] API response:', response);
      setState({
        verificationRecordId: response.verificationRecordId,
        expiresAt: new Date(response.expiresAt),
        isVerified: true,
      });
      console.log('[useVerification] State updated, returning recordId');
      return response.verificationRecordId;
    } catch (err) {
      console.error('[useVerification] Error caught:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      throw err;
    } finally {
      console.log('[useVerification] Finally block, setting isVerifying to false');
      setIsVerifying(false);
    }
  }, []);

  const clearVerification = useCallback(() => {
    setState({
      verificationRecordId: null,
      expiresAt: null,
      isVerified: false,
    });
    setError(null);
  }, []);

  const isExpired = state.expiresAt ? new Date() > state.expiresAt : true;

  return {
    ...state,
    isExpired: state.isVerified ? isExpired : true,
    isVerifying,
    error,
    verifyPassword,
    clearVerification,
  };
}
