'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, LocaleConfig, defaultLocale, getLocaleConfig, isRTL } from './config';

// Import all translations
import { tr } from './locales/tr';
import { en } from './locales/en';
import { it } from './locales/it';
import { fa } from './locales/fa';
import { id } from './locales/id';
import { ar } from './locales/ar';

const translations: Record<Locale, typeof tr> = {
  tr,
  en,
  it,
  fa,
  id,
  ar,
  ms: en, // Fallback to English until Malay is ready
  th: en, // Fallback to English until Thai is ready
};

type TranslationKeys = typeof tr;
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K
      : never
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<TranslationKeys>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  config: LocaleConfig;
  isRTL: boolean;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'order-locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  // Update HTML attributes when locale changes
  useEffect(() => {
    if (!mounted) return;
    
    const config = getLocaleConfig(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = config.dir;
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
    }
  }, []);

  // Translation function with nested key support and parameter interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to default locale
        value = translations[defaultLocale];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Parameter interpolation: {{param}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() ?? `{{${paramKey}}}`;
      });
    }

    return value;
  }, [locale]);

  const config = getLocaleConfig(locale);

  const formatNumber = useCallback((num: number): string => {
    const { decimal, thousand } = config.numberFormat;
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    return parts.length > 1 ? `${integerPart}${decimal}${parts[1]}` : integerPart;
  }, [config]);

  const formatCurrency = useCallback((amount: number): string => {
    const formatted = formatNumber(amount);
    const { currencySymbol } = config;
    
    // RTL languages: symbol after amount
    if (isRTL(locale)) {
      return `${formatted} ${currencySymbol}`;
    }
    return `${currencySymbol}${formatted}`;
  }, [config, formatNumber, locale]);

  const formatDate = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return config.dateFormat
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString());
  }, [config]);

  const formatTime = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return config.timeFormat
      .replace('HH', hours)
      .replace('mm', minutes);
  }, [config]);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    config,
    isRTL: isRTL(locale),
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use translations
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

// Hook for just the translation function (lighter)
export function useT() {
  const { t } = useTranslation();
  return t;
}
