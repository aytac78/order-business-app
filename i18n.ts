import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['tr', 'en', 'it'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  it: 'Italiano'
};

export const localeFlags: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  it: '🇮🇹'
};

export const defaultLocale: Locale = 'tr';

export default getRequestConfig(async () => {
  // Cookie'den dil tercihini al
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  
  // Geçerli bir locale mı kontrol et
  const locale = locales.includes(localeCookie as Locale) 
    ? (localeCookie as Locale) 
    : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
