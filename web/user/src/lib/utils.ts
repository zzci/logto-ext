import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '@/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  return new Date(timestamp).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format phone number for display.
 * Handles both "+8613812345678" and "8613812345678" (Logto may omit the +).
 * e.g. "+8613812345678" → "+86 138 1234 5678"
 *      "85256182666"    → "+852 5618 2666"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';

  // Normalize: ensure leading +
  const normalized = phone.startsWith('+') ? phone : `+${phone}`;

  // China: +86 xxx xxxx xxxx
  const cn = normalized.match(/^\+86(\d{3})(\d{4})(\d{4})$/);
  if (cn) return `+86 ${cn[1]} ${cn[2]} ${cn[3]}`;

  // US/CA: +1 xxx xxx xxxx
  const us = normalized.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (us) return `+1 ${us[1]} ${us[2]} ${us[3]}`;

  // HK/MO: +852/+853 xxxx xxxx
  const hk = normalized.match(/^\+(852|853)(\d{4})(\d{4})$/);
  if (hk) return `+${hk[1]} ${hk[2]} ${hk[3]}`;

  // TW: +886 x xxxx xxxx or +886 xx xxxx xxxx
  const tw = normalized.match(/^\+886(\d{1,2})(\d{4})(\d{4})$/);
  if (tw) return `+886 ${tw[1]} ${tw[2]} ${tw[3]}`;

  // JP: +81 xx xxxx xxxx
  const jp = normalized.match(/^\+81(\d{2})(\d{4})(\d{4})$/);
  if (jp) return `+81 ${jp[1]} ${jp[2]} ${jp[3]}`;

  // Generic: +CC rest (insert space after country code)
  const generic = normalized.match(/^\+(\d{1,3})(\d+)$/);
  if (generic) {
    const rest = generic[2];
    const groups = rest.match(/.{1,4}/g) || [];
    return `+${generic[1]} ${groups.join(' ')}`;
  }

  return phone;
}
