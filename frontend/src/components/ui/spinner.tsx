import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t('common.loading');

  return (
    <div className={cn('flex items-center justify-center h-64', className)}>
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        {displayLabel && <p className="text-gray-500 text-sm">{displayLabel}</p>}
      </div>
    </div>
  );
}
