'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useNotificationStore } from '@/stores';
import { useThemeStore } from '@/stores/themeStore';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Globe,
  Palette,
  Shield,
  Database,
  Printer,
  CreditCard,
  Store,
  Users,
  Clock,
  Check,
  ChevronRight,
  Save,
  AlertCircle
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const { currentVenue } = useVenueStore();
  const { soundEnabled, toggleSound } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local settings state
  const [settings, setSettings] = useState({
    language: 'tr',
    currency: 'TRY',
    taxRate: 8,
    autoAcceptOrders: false,
    notificationsEnabled: true,
    printReceipts: true,
    requirePin: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    // Save settings to localStorage or Supabase
    localStorage.setItem('order-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themeOptions: { value: Theme; label: string; icon: any; desc: string }[] = [
    { value: 'dark', label: 'Koyu', icon: Moon, desc: 'Göz yorgunluğunu azaltır' },
    { value: 'light', label: 'Açık', icon: Sun, desc: 'Aydınlık ortamlar için' },
    { value: 'system', label: 'Sistem', icon: Monitor, desc: 'Cihaz ayarını takip et' },
  ];

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-96" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {currentVenue?.name || 'Sistem'} ayarlarını yönetin
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
            saved 
              ? 'bg-green-500 text-white' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* Theme Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Görünüm</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tema ve renk ayarları</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tema Seçimi</p>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  theme === option.value
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  theme === option.value 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  <option.icon className="w-5 h-5" />
                </div>
                <p className={`font-medium ${
                  theme === option.value ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.desc}</p>
                {theme === option.value && (
                  <div className="mt-2 flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">Aktif</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Bildirimler</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ses ve bildirim ayarları</p>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-gray-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Bildirim Sesleri</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Yeni sipariş ve uyarı sesleri</p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${
                soundEnabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.notificationsEnabled ? (
                <Bell className="w-5 h-5 text-gray-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Bildirimleri</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Masaüstü bildirimleri al</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.notificationsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${
                settings.notificationsEnabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Business Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">İşletme Ayarları</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sipariş ve ödeme ayarları</p>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Otomatik Sipariş Onayı</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Siparişleri otomatik kabul et</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, autoAcceptOrders: !s.autoAcceptOrders }))}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.autoAcceptOrders ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${
                settings.autoAcceptOrders ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Otomatik Fiş Yazdırma</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sipariş alındığında fiş yazdır</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, printReceipts: !s.printReceipts }))}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.printReceipts ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${
                settings.printReceipts ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">PIN ile Giriş Zorunlu</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">İşlemler için PIN iste</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, requirePin: !s.requirePin }))}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.requirePin ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow absolute top-1 transition-all ${
                settings.requirePin ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Bölgesel Ayarlar</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dil, para birimi ve vergi</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Dil</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings(s => ({ ...s, language: e.target.value }))}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="ar">🇸🇦 العربية</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Para Birimi</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="TRY">₺ Türk Lirası (TRY)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">KDV Oranı (%)</label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => setSettings(s => ({ ...s, taxRate: parseInt(e.target.value) || 0 }))}
              min="0"
              max="50"
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Hızlı Erişim</h2>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {[
            { icon: Users, label: 'Personel Yönetimi', href: '/staff', color: 'text-blue-500' },
            { icon: CreditCard, label: 'Ödeme Yöntemleri', href: '/pos', color: 'text-green-500' },
            { icon: Database, label: 'Yedekleme & Veri', href: '#', color: 'text-purple-500' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
        <p>ORDER Business v1.0.0</p>
        <p className="mt-1">© 2025 TiT Technologies</p>
      </div>
    </div>
  );
}
