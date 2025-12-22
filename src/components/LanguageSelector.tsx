'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getAllLocales, Locale } from '@/lib/i18n/config';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { locale, setLocale, config } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locales = getAllLocales();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title={config.nativeName}
        >
          <span className="text-xl">{config.flag}</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSelect(loc.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors ${
                  locale === loc.code ? 'bg-gray-700' : ''
                }`}
              >
                <span className="text-lg">{loc.flag}</span>
                <span className="text-sm text-white">{loc.nativeName}</span>
                {locale === loc.code && <Check className="w-4 h-4 text-green-400 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xl">{config.flag}</span>
        <span className="text-sm font-medium flex-1 text-left">{config.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-700">
            <p className="text-xs text-gray-400">Dil Seçin</p>
          </div>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleSelect(loc.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors ${
                locale === loc.code ? 'bg-gray-700' : ''
              }`}
            >
              <span className="text-lg">{loc.flag}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{loc.nativeName}</p>
                <p className="text-xs text-gray-400">{loc.name}</p>
              </div>
              {locale === loc.code && <Check className="w-4 h-4 text-green-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
