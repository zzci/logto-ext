import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select, Avatar, Alert } from '@/components/ui';
import { useAccount } from '@/hooks';
import type { UserProfile } from '@/types';

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { t } = useTranslation();
  const { updateProfile, updateExtendedProfile, isUpdating } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Guard: don't re-sync form from server during submission
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    username: profile.username || '',
    name: profile.name || '',
    avatar: profile.avatar || '',
    nickname: profile.profile?.nickname || '',
    givenName: profile.profile?.givenName || '',
    familyName: profile.profile?.familyName || '',
    website: profile.profile?.website || '',
    gender: profile.profile?.gender || '',
    birthdate: profile.profile?.birthdate || '',
  });

  // Sync from server data — but skip during submission to avoid flash
  useEffect(() => {
    if (isSubmittingRef.current) return;
    setFormData({
      username: profile.username || '',
      name: profile.name || '',
      avatar: profile.avatar || '',
      nickname: profile.profile?.nickname || '',
      givenName: profile.profile?.givenName || '',
      familyName: profile.profile?.familyName || '',
      website: profile.profile?.website || '',
      gender: profile.profile?.gender || '',
      birthdate: profile.profile?.birthdate || '',
    });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    isSubmittingRef.current = true;
    try {
      await updateProfile({
        name: formData.name || undefined,
        avatar: formData.avatar || undefined,
      });

      await updateExtendedProfile({
        nickname: formData.nickname || undefined,
        givenName: formData.givenName || undefined,
        familyName: formData.familyName || undefined,
        website: formData.website || undefined,
        gender: formData.gender || undefined,
        birthdate: formData.birthdate || undefined,
      });

      setSuccess(t('profile.updateSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.updateError'));
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Avatar Section — stacked on mobile */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Avatar src={formData.avatar} name={formData.name} size="xl" className="flex-shrink-0" />
        <div className="w-full">
          <Input
            name="avatar"
            label={t('profile.avatar')}
            value={formData.avatar}
            onChange={handleChange}
            placeholder={t('profile.avatarPlaceholder')}
            hint={t('profile.avatarHint')}
            disabled={isUpdating}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('profile.username')}
          name="username"
          value={formData.username}
          disabled
          hint={t('profile.usernameReadonly')}
        />
        <Input
          label={t('profile.displayName')}
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={t('profile.displayNamePlaceholder')}
          disabled={isUpdating}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('profile.givenName')}
          name="givenName"
          value={formData.givenName}
          onChange={handleChange}
          disabled={isUpdating}
        />
        <Input
          label={t('profile.familyName')}
          name="familyName"
          value={formData.familyName}
          onChange={handleChange}
          disabled={isUpdating}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('profile.nickname')}
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
          disabled={isUpdating}
        />
        <Input
          label={t('profile.website')}
          name="website"
          type="url"
          value={formData.website}
          onChange={handleChange}
          placeholder={t('profile.websitePlaceholder')}
          disabled={isUpdating}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('profile.gender')}
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          disabled={isUpdating}
        >
          <option value="">{t('profile.genderOptions.unset')}</option>
          <option value="male">{t('profile.genderOptions.male')}</option>
          <option value="female">{t('profile.genderOptions.female')}</option>
          <option value="other">{t('profile.genderOptions.other')}</option>
        </Select>
        <Input
          label={t('profile.birthdate')}
          name="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={handleChange}
          disabled={isUpdating}
        />
      </div>

      {/* Sticky save on mobile */}
      <div className="flex justify-end sticky bottom-16 sm:bottom-0 sm:static pt-2 pb-2 sm:pb-0 bg-white sm:bg-transparent -mx-4 sm:mx-0 px-4 sm:px-0 border-t sm:border-0 border-gray-100">
        <Button type="submit" loading={isUpdating} className="w-full sm:w-auto">
          {t('profile.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
