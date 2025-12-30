'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Check, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
];

export function LanguageSelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('tr');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cookie'den mevcut dili al
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'tr';
    setCurrentLocale(locale);

    // Dropdown dışına tıklamada kapat
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (locale: string) => {
    // Cookie'ye kaydet (1 yıl)
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    setCurrentLocale(locale);
    setIsOpen(false);
    
    // Sayfayı yenile
    router.refresh();
    window.location.reload();
  };

  const currentLanguage = languages.find(l => l.code === currentLocale) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm text-white hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-44 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-[110]">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  currentLocale === lang.code
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-sm">{lang.name}</span>
                {currentLocale === lang.code && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for header
export function LanguageSelectorCompact() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('tr');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const locale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'tr';
    setCurrentLocale(locale);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    setCurrentLocale(locale);
    setIsOpen(false);
    router.refresh();
    window.location.reload();
  };

  const currentLanguage = languages.find(l => l.code === currentLocale) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        title="Dil Seç"
      >
        <Globe className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-[110]">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  currentLocale === lang.code
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
