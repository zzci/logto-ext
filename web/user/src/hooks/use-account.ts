import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLogto } from '@logto/react';
import { useEffect } from 'react';
import i18n from '@/i18n';
import { mapLocaleToLanguage } from '@/i18n';
import { accountApi } from '@/services';
import type {
  UserProfile,
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
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Sync profile locale → i18n language
  const profileLocale = profileQuery.data?.profile?.locale;
  useEffect(() => {
    const lang = mapLocaleToLanguage(profileLocale);
    if (lang && lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  }, [profileLocale]);

  // Update basic profile — use response to update cache directly (no refetch)
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => accountApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<UserProfile>(['profile'], (old) =>
        old ? { ...old, ...updatedProfile } : updatedProfile
      );
    },
  });

  // Update extended profile — merge response into cached profile
  const updateExtendedProfileMutation = useMutation({
    mutationFn: (data: UpdateExtendedProfileRequest) =>
      accountApi.updateExtendedProfile(data),
    onSuccess: (_data, variables) => {
      // The API returns the extended profile sub-object, not the full UserProfile.
      // Merge the submitted fields into the cached profile directly.
      queryClient.setQueryData<UserProfile>(['profile'], (old) =>
        old ? { ...old, profile: { ...old.profile, ...variables } } : old
      );
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
