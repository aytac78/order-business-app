'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Check, ChevronDown } from 'lucide-react';

// Locale config
const localeConfig = {
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
};

type Locale = keyof typeof localeConfig;

export function LanguageSelector() {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = localeConfig[currentLocale] || localeConfig.tr;

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
    // Cookie'ye kaydet
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    setIsOpen(false);
    // Sayfayı yenile
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button"
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
            {Object.entries(localeConfig).map(([code, loc]) => (
              <button type="button"
                key={code}
                onClick={() => handleSelect(code as Locale)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  currentLocale === code ? 'bg-orange-50' : ''
                }`}
              >
                <span className="text-xl">{loc.flag}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${currentLocale === code ? 'text-orange-600' : 'text-gray-900'}`}>
                    {loc.nativeName}
                  </p>
                  <p className="text-xs text-gray-500">{loc.name}</p>
                </div>
                {currentLocale === code && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              🌍 3 languages supported
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for header
export function LanguageSelectorCompact() {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = localeConfig[currentLocale] || localeConfig.tr;

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
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        title={config.nativeName}
      >
        <span className="text-lg">{config.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 min-w-[200px]">
          {Object.entries(localeConfig).map(([code, loc]) => (
            <button type="button"
              key={code}
              onClick={() => handleSelect(code as Locale)}
              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 ${
                currentLocale === code ? 'bg-orange-50' : ''
              }`}
            >
              <span className="text-lg">{loc.flag}</span>
              <span className={`text-sm ${currentLocale === code ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
                {loc.nativeName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
