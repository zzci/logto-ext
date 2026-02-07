import { useState } from 'react';
import { Button, Input, Modal, Alert } from '@/components/ui';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function PasswordVerificationModal({
  isOpen,
  onClose,
  onVerify,
  title = '验证身份',
  description = '请输入您的密码以继续此操作',
}: PasswordVerificationModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onVerify(password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码验证失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        {error && <Alert type="error">{error}</Alert>}

        <Input
          type="password"
          label="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入当前密码"
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button type="submit" loading={isLoading}>
            验证
          </Button>
        </div>
      </form>
    </Modal>
  );
}
