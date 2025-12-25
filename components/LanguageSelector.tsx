'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getAllLocales, Locale } from '@/lib/i18n/config';
import { Globe, Check, ChevronDown } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale, config } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locales = getAllLocales();

  // Close dropdown when clicking outside
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="text-xl">{config.flag}</span>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {config.nativeName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe className="w-4 h-4" />
              <span>Dil Seçin / Select Language</span>
            </div>
          </div>
          
          <div className="py-1 max-h-80 overflow-y-auto">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSelect(loc.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  locale === loc.code ? 'bg-orange-50' : ''
                }`}
              >
                <span className="text-xl">{loc.flag}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${locale === loc.code ? 'text-orange-600' : 'text-gray-900'}`}>
                    {loc.nativeName}
                  </p>
                  <p className="text-xs text-gray-500">{loc.name}</p>
                </div>
                {locale === loc.code && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              🌍 8 languages supported
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile/sidebar
export function LanguageSelectorCompact() {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        title={config.nativeName}
      >
        <span className="text-lg">{config.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 min-w-[200px]">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 ${
                locale === loc.code ? 'bg-orange-50' : ''
              }`}
            >
              <span className="text-lg">{loc.flag}</span>
              <span className={`text-sm ${locale === loc.code ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
                {loc.nativeName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
