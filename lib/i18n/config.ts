// i18n Configuration
export type Locale = 'tr' | 'en' | 'it' | 'fa' | 'id' | 'ms' | 'th' | 'ar';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currency: string;
  currencySymbol: string;
  numberFormat: {
    decimal: string;
    thousand: string;
  };
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    dir: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'TRY',
    currencySymbol: '₺',
    numberFormat: { decimal: ',', thousand: '.' }
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    currency: 'USD',
    currencySymbol: '$',
    numberFormat: { decimal: '.', thousand: ',' }
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    currencySymbol: '€',
    numberFormat: { decimal: ',', thousand: '.' }
  },
  fa: {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    flag: '🇮🇷',
    dir: 'rtl',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: 'IRR',
    currencySymbol: '﷼',
    numberFormat: { decimal: '٫', thousand: '٬' }
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'IDR',
    currencySymbol: 'Rp',
    numberFormat: { decimal: ',', thousand: '.' }
  },
  ms: {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    flag: '🇲🇾',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'MYR',
    currencySymbol: 'RM',
    numberFormat: { decimal: '.', thousand: ',' }
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'THB',
    currencySymbol: '฿',
    numberFormat: { decimal: '.', thousand: ',' }
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇦🇪',
    dir: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'AED',
    currencySymbol: 'د.إ',
    numberFormat: { decimal: '٫', thousand: '٬' }
  }
};

export const defaultLocale: Locale = 'tr';
export const rtlLocales: Locale[] = ['fa', 'ar'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return localeConfigs[locale] || localeConfigs[defaultLocale];
}

export function getAllLocales(): LocaleConfig[] {
  return Object.values(localeConfigs);
}
