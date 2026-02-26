import { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CountryCodeDef {
  code: string;
  labelKey: string;
  flag: string;
}

const countryCodeDefs: CountryCodeDef[] = [
  { code: '+86', labelKey: 'phone.countries.CN', flag: '🇨🇳' },
  { code: '+852', labelKey: 'phone.countries.HK', flag: '🇭🇰' },
  { code: '+853', labelKey: 'phone.countries.MO', flag: '🇲🇴' },
  { code: '+886', labelKey: 'phone.countries.TW', flag: '🇹🇼' },
  { code: '+1', labelKey: 'phone.countries.US', flag: '🇺🇸' },
  { code: '+44', labelKey: 'phone.countries.GB', flag: '🇬🇧' },
  { code: '+81', labelKey: 'phone.countries.JP', flag: '🇯🇵' },
  { code: '+82', labelKey: 'phone.countries.KR', flag: '🇰🇷' },
  { code: '+65', labelKey: 'phone.countries.SG', flag: '🇸🇬' },
  { code: '+61', labelKey: 'phone.countries.AU', flag: '🇦🇺' },
  { code: '+49', labelKey: 'phone.countries.DE', flag: '🇩🇪' },
  { code: '+33', labelKey: 'phone.countries.FR', flag: '🇫🇷' },
];

export interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, label, error, hint, placeholder, disabled, className }, ref) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder ?? t('security.emailPhone.phonePlaceholder');

    // Parse existing value to extract country code and number
    const parseValue = (val: string) => {
      for (const cc of countryCodeDefs) {
        if (val.startsWith(cc.code)) {
          return { countryCode: cc.code, number: val.slice(cc.code.length) };
        }
      }
      // Default to +86
      return { countryCode: '+86', number: val.replace(/^\+?\d{1,3}/, '') };
    };

    const parsed = parseValue(value);
    const [countryCode, setCountryCode] = useState(parsed.countryCode);
    const number = parsed.number;

    const handleCountryChange = (newCode: string) => {
      setCountryCode(newCode);
      onChange(newCode + number);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = e.target.value.replace(/[^\d]/g, '');
      onChange(countryCode + num);
    };

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        )}
        <div className="flex">
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'rounded-l-lg border border-r-0 px-2 py-2 bg-gray-50 text-gray-700 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              error ? 'border-red-300' : 'border-gray-300'
            )}
          >
            {countryCodeDefs.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.flag} {cc.code}
              </option>
            ))}
          </select>
          <input
            ref={ref}
            type="tel"
            value={number}
            onChange={handleNumberChange}
            placeholder={defaultPlaceholder}
            disabled={disabled}
            className={cn(
              'flex-1 rounded-r-lg border px-3 py-2 bg-white text-gray-900 shadow-sm transition-colors',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            )}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
