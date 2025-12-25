'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { translateText, loadTranslationCache } from '@/lib/i18n/autoTranslate';

interface TProps {
  children: string;
  from?: string;
}

// Otomatik çeviri component'i
// Kullanım: <T>Türkçe metin</T>
export function T({ children, from = 'tr' }: TProps) {
  const { locale } = useTranslation();
  const [translated, setTranslated] = useState(children);
  
  useEffect(() => {
    loadTranslationCache();
  }, []);
  
  useEffect(() => {
    if (locale === from) {
      setTranslated(children);
      return;
    }
    
    let mounted = true;
    
    translateText(children, locale, from).then(result => {
      if (mounted) setTranslated(result);
    });
    
    return () => { mounted = false; };
  }, [children, locale, from]);
  
  return <>{translated}</>;
}

// Hook versiyonu - dinamik metinler için
export function useAutoTranslate(text: string, from: string = 'tr'): string {
  const { locale } = useTranslation();
  const [translated, setTranslated] = useState(text);
  
  useEffect(() => {
    loadTranslationCache();
  }, []);
  
  useEffect(() => {
    if (locale === from || !text) {
      setTranslated(text);
      return;
    }
    
    let mounted = true;
    
    translateText(text, locale, from).then(result => {
      if (mounted) setTranslated(result);
    });
    
    return () => { mounted = false; };
  }, [text, locale, from]);
  
  return translated;
}
