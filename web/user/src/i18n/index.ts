import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

function detectBrowserLanguage(): string {
  const lang = navigator.language || '';
  if (lang.startsWith('en')) return 'en';
  return 'zh-CN';
}

i18n.use(initReactI18next).init({
  resources: { 'zh-CN': { translation: zhCN }, en: { translation: en } },
  lng: detectBrowserLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;

export function mapLocaleToLanguage(locale: string | undefined): string | null {
  if (!locale) return null;
  if (locale.startsWith('zh')) return 'zh-CN';
  if (locale.startsWith('en')) return 'en';
  return null;
}
