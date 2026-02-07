import { useState, useEffect } from 'react';
import { Button, Input, Avatar, Alert } from '@/components/ui';
import { useAccount } from '@/hooks';
import type { UserProfile } from '@/types';

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { updateProfile, updateExtendedProfile, isUpdating } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
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
    setSuccess(false);

    try {
      // Update basic profile (username is read-only)
      await updateProfile({
        name: formData.name || undefined,
        avatar: formData.avatar || undefined,
      });

      // Update extended profile
      await updateExtendedProfile({
        nickname: formData.nickname || undefined,
        givenName: formData.givenName || undefined,
        familyName: formData.familyName || undefined,
        website: formData.website || undefined,
        gender: formData.gender || undefined,
        birthdate: formData.birthdate || undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">个人资料已更新</Alert>}

      {/* Avatar Section */}
      <div className="flex items-center gap-4">
        <Avatar src={formData.avatar} name={formData.name} size="xl" />
        <div>
          <Input
            name="avatar"
            value={formData.avatar}
            onChange={handleChange}
            placeholder="输入头像 URL"
            hint="支持 HTTPS 图片链接"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="用户名"
          name="username"
          value={formData.username}
          disabled
          hint="用户名为只读"
        />
        <Input
          label="显示名称"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="您的名称"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="名"
          name="givenName"
          value={formData.givenName}
          onChange={handleChange}
        />
        <Input
          label="姓"
          name="familyName"
          value={formData.familyName}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="昵称"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
        />
        <Input
          label="个人网站"
          name="website"
          type="url"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            性别
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">未设置</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>
        <Input
          label="生日"
          name="birthdate"
          type="date"
          value={formData.birthdate}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isUpdating}>
          保存更改
        </Button>
      </div>
    </form>
  );
}
