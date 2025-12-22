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
  ms: en,
  th: en,
};

// Ülke kodundan dil eşleştirmesi
const countryToLocale: Record<string, Locale> = {
  TR: 'tr',
  US: 'en',
  GB: 'en',
  AU: 'en',
  CA: 'en',
  NZ: 'en',
  IT: 'it',
  IR: 'fa',
  AF: 'fa',
  ID: 'id',
  MY: 'ms',
  TH: 'th',
  SA: 'ar',
  AE: 'ar',
  EG: 'ar',
  IQ: 'ar',
  JO: 'ar',
  KW: 'ar',
  LB: 'ar',
  LY: 'ar',
  MA: 'ar',
  OM: 'ar',
  QA: 'ar',
  SY: 'ar',
  TN: 'ar',
  YE: 'ar',
  BH: 'ar',
};

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
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Konumdan ülke kodu al
async function getCountryFromLocation(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&result_type=country`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const countryComponent = data.results[0].address_components?.find(
        (c: any) => c.types.includes('country')
      );
      return countryComponent?.short_name || null;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

// Tarayıcı dilinden locale tahmin et
function getLocaleFromBrowser(): Locale | null {
  if (typeof navigator === 'undefined') return null;
  
  const browserLang = navigator.language?.split('-')[0];
  const langToLocale: Record<string, Locale> = {
    tr: 'tr',
    en: 'en',
    it: 'it',
    fa: 'fa',
    id: 'id',
    ms: 'ms',
    th: 'th',
    ar: 'ar',
  };
  
  return langToLocale[browserLang] || null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);

  // Konum bazlı dil seçimi
  useEffect(() => {
    const detectLocale = async () => {
      // 1. Önce localStorage kontrol et
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && translations[saved]) {
        setLocaleState(saved);
        setMounted(true);
        setLocationChecked(true);
        return;
      }

      // 2. Konum izni varsa konumdan dil belirle
      if (GOOGLE_MAPS_API_KEY && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 86400000, // 24 saat cache
            });
          });

          const { latitude, longitude } = position.coords;
          const countryCode = await getCountryFromLocation(latitude, longitude);
          
          if (countryCode && countryToLocale[countryCode]) {
            const detectedLocale = countryToLocale[countryCode];
            setLocaleState(detectedLocale);
            localStorage.setItem(STORAGE_KEY, detectedLocale);
            setMounted(true);
            setLocationChecked(true);
            return;
          }
        } catch (error) {
          console.log('Geolocation not available or denied');
        }
      }

      // 3. Fallback: Tarayıcı dili
      const browserLocale = getLocaleFromBrowser();
      if (browserLocale && translations[browserLocale]) {
        setLocaleState(browserLocale);
        localStorage.setItem(STORAGE_KEY, browserLocale);
      }

      setMounted(true);
      setLocationChecked(true);
    };

    detectLocale();
  }, []);

  // HTML attributes güncelle
  useEffect(() => {
    if (!mounted) return;
    
    const config = getLocaleConfig(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = config.dir;
    
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
    }
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation missing: ${key}`);
      return key;
    }
    
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => 
        String(params[paramKey] ?? `{{${paramKey}}}`)
      );
    }
    
    return value;
  }, [locale]);

  const config = getLocaleConfig(locale);

  const formatNumber = useCallback((num: number): string => {
    const { decimal, thousand } = config.numberFormat;
    const parts = num.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    return parts.join(decimal);
  }, [config]);

  const formatCurrency = useCallback((amount: number): string => {
    const { currencySymbol } = config;
    const formatted = formatNumber(amount);
    
    // RTL dillerde para birimi sonda
    if (config.dir === 'rtl') {
      return `${formatted} ${currencySymbol}`;
    }
    return `${currencySymbol}${formatted}`;
  }, [config, formatNumber]);

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

  // Hydration için bekle
  if (!mounted) {
    return null;
  }

  return (
    <I18nContext.Provider value={{
      locale,
      setLocale,
      t,
      config,
      isRTL: config.dir === 'rtl',
      formatNumber,
      formatCurrency,
      formatDate,
      formatTime,
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

export function useT() {
  const { t } = useTranslation();
  return t;
}
