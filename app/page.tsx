'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  Building2,
  Users,
  Globe,
  ChevronDown,
  Utensils,
  ArrowRight,
  Loader2,
  LogOut,
  User
} from 'lucide-react';
import {
  Language,
  languages,
  detectLanguageFromLocation,
  getSavedLanguage,
  saveLanguage,
  getTranslation,
  isRTL
} from '@/lib/i18n';

export default function HomePage() {
  const router = useRouter();
  const { currentStaff, isAuthenticated, logout } = useAuthStore();
  const [language, setLanguage] = useState<Language>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [mounted, setMounted] = useState(false);

  const t = getTranslation(language);
  const rtl = isRTL(language);

  useEffect(() => {
    setMounted(true);
    initLanguage();
  }, []);

  const initLanguage = async () => {
    const saved = getSavedLanguage();
    if (saved) {
      setLanguage(saved);
      setIsDetecting(false);
      return;
    }

    try {
      const detected = await detectLanguageFromLocation();
      setLanguage(detected);
      saveLanguage(detected);
    } catch {
      setLanguage('en');
    }
    setIsDetecting(false);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    saveLanguage(lang);
    setShowLangMenu(false);
  };

  const handleLogout = () => {
    logout();
    // localStorage temizle
    if (typeof window !== 'undefined') {
      localStorage.removeItem('order-auth-storage');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const currentLang = languages.find(l => l.code === language);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {/* Top Bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        {/* Logged In User Info */}
        {isAuthenticated && currentStaff && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-xl">
            <User className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">{currentStaff.name}</span>
            <button
              onClick={handleLogout}
              className="ml-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all"
          >
            {isDetecting ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <>
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-lg">{currentLang?.flag}</span>
                <span className="text-sm text-gray-300">{currentLang?.nativeName}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {showLangMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                    language === lang.code ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm text-gray-200">{lang.nativeName}</span>
                  {language === lang.code && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-orange-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
              <Utensils className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.login.title}</h1>
            <p className="text-gray-400">{t.login.subtitle}</p>
          </div>

          {/* Already Logged In Banner */}
          {isAuthenticated && currentStaff && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 font-medium">Oturum Açık</p>
                  <p className="text-sm text-gray-400">{currentStaff.name} olarak giriş yapılmış</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Dashboard'a Git
                </button>
              </div>
            </div>
          )}

          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Owner Card */}
            <button
              onClick={() => router.push('/auth/owner')}
              className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 text-left"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {t.login.ownerTitle}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                {t.login.ownerDesc}
              </p>
              <div className="flex items-center gap-2 text-orange-500 text-sm font-medium">
                <span>{t.login.ownerLogin}</span>
                <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${rtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </div>
            </button>

            {/* Staff Card */}
            <button
              onClick={() => router.push('/auth/staff')}
              className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 text-left"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {t.login.staffTitle}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                {t.login.staffDesc}
              </p>
              <div className="flex items-center gap-2 text-purple-500 text-sm font-medium">
                <span>{t.login.staffLogin}</span>
                <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${rtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              Powered by <span className="text-orange-500 font-medium">TiT</span> Technology
            </p>
          </div>
        </div>
      </div>

      {/* Click outside to close language menu */}
      {showLangMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLangMenu(false)} 
        />
      )}
    </div>
  );
}
