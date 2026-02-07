import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLogto } from '@logto/react';
import { accountApi } from '@/services';

export function useMfa() {
  const { isAuthenticated } = useLogto();
  const queryClient = useQueryClient();

  const mfaQuery = useQuery({
    queryKey: ['mfa-verifications'],
    queryFn: () => accountApi.getMfaVerifications(),
    enabled: isAuthenticated,
  });

  const createTotpMutation = useMutation({
    mutationFn: (verificationRecordId: string) =>
      accountApi.createTotpSecret(verificationRecordId),
  });

  const verifyTotpMutation = useMutation({
    mutationFn: ({
      code,
      verificationRecordId,
    }: {
      code: string;
      verificationRecordId: string;
    }) => accountApi.verifyAndBindTotp(code, verificationRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-verifications'] });
    },
  });

  const generateBackupCodesMutation = useMutation({
    mutationFn: (verificationRecordId: string) =>
      accountApi.generateBackupCodes(verificationRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-verifications'] });
    },
  });

  const deleteMfaMutation = useMutation({
    mutationFn: ({
      id,
      verificationRecordId,
    }: {
      id: string;
      verificationRecordId: string;
    }) => accountApi.deleteMfaVerification(id, verificationRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-verifications'] });
    },
  });

  return {
    mfaVerifications: mfaQuery.data ?? [],
    isLoading: mfaQuery.isLoading,
    error: mfaQuery.error,
    createTotp: createTotpMutation.mutateAsync,
    verifyTotp: verifyTotpMutation.mutateAsync,
    generateBackupCodes: generateBackupCodesMutation.mutateAsync,
    deleteMfa: deleteMfaMutation.mutateAsync,
    isCreatingTotp: createTotpMutation.isPending,
    isVerifyingTotp: verifyTotpMutation.isPending,
  };
}
