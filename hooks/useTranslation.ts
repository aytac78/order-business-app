'use client';

import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import translations
import en from '@/locales/en.json';
import it from '@/locales/it.json';
import tr from '@/locales/tr.json';

type Locale = 'en' | 'it' | 'tr';

interface TranslationStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<TranslationStore>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'order-locale-storage',
    }
  )
);

type TranslationKeys = typeof en;

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

const translations: Record<Locale, TranslationKeys> = {
  en,
  it,
  tr,
};

export function useTranslation() {
  const { locale, setLocale } = useLocaleStore();
  
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations[locale], key);
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }
    
    return translation;
  }, [locale]);
  
  return {
    t,
    locale,
    setLocale,
    availableLocales: ['en', 'it', 'tr'] as Locale[],
  };
}

// Export locale labels for UI
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
  tr: 'Türkçe',
};
