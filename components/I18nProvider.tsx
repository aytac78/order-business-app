'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';

// Çeviri dosyalarını import et
import tr from '@/messages/tr.json';
import en from '@/messages/en.json';
import it from '@/messages/it.json';

const messages: Record<string, any> = { tr, en, it };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('tr');

  useEffect(() => {
    // Cookie'den dili al
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'tr';
    setLocale(savedLocale);

    // Cookie değişikliğini dinle
    const checkLocale = () => {
      const currentLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('locale='))
        ?.split('=')[1] || 'tr';
      if (currentLocale !== locale) {
        setLocale(currentLocale);
      }
    };

    const interval = setInterval(checkLocale, 500);
    return () => clearInterval(interval);
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale] || messages.tr}>
      {children}
    </NextIntlClientProvider>
  );
}
