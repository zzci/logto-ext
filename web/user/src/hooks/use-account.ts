import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLogto } from '@logto/react';
import { useEffect } from 'react';
import { accountApi } from '@/services';
import type {
  UpdateProfileRequest,
  UpdateExtendedProfileRequest,
} from '@/types';

export function useAccount() {
  const { getAccessToken, isAuthenticated } = useLogto();
  const queryClient = useQueryClient();

  // Configure the API service with access token getter
  useEffect(() => {
    if (isAuthenticated) {
      accountApi.setAccessTokenGetter(async () => {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Failed to get access token');
        }
        return token;
      });
    }
  }, [isAuthenticated, getAccessToken]);

  // Fetch user profile
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => accountApi.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Update basic profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => accountApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Update extended profile
  const updateExtendedProfileMutation = useMutation({
    mutationFn: (data: UpdateExtendedProfileRequest) =>
      accountApi.updateExtendedProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    updateExtendedProfile: updateExtendedProfileMutation.mutateAsync,
    isUpdating:
      updateProfileMutation.isPending || updateExtendedProfileMutation.isPending,
  };
}
