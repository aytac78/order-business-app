'use client';

import { useTranslations, useLocale } from 'next-intl';

// Backward compatible useTranslation hook
export function useTranslation() {
  const t = useTranslations();
  const locale = useLocale();

  const formatCurrency = (amount: number) => {
    const currencyMap: Record<string, string> = {
      tr: 'TRY',
      en: 'USD',
      it: 'EUR'
    };
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyMap[locale] || 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(d);
  };

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return locale === 'tr' ? 'Az önce' : locale === 'it' ? 'Proprio ora' : 'Just now';
    if (diffMins < 60) return `${diffMins} ${locale === 'tr' ? 'dk önce' : locale === 'it' ? 'min fa' : 'min ago'}`;
    if (diffHours < 24) return `${diffHours} ${locale === 'tr' ? 'saat önce' : locale === 'it' ? 'ore fa' : 'hours ago'}`;
    return `${diffDays} ${locale === 'tr' ? 'gün önce' : locale === 'it' ? 'giorni fa' : 'days ago'}`;
  };

  return {
    t,
    locale,
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime
  };
}

// Export locale utilities
export { useLocale } from 'next-intl';
