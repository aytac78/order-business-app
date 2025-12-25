'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import {
  QrCode,
  Download,
  Copy,
  Eye,
  Palette,
  Image,
  Type,
  Globe,
  Smartphone,
  Settings,
  Check,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface QRSettings {
  menuUrl: string;
  primaryColor: string;
  logoEnabled: boolean;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export default function QRMenuPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'design' | 'settings'>('qr');
  
  const [settings, setSettings] = useState<QRSettings>({
    menuUrl: '',
    primaryColor: '#f97316',
    logoEnabled: true,
    showPrices: true,
    showImages: true,
    showDescriptions: true,
    language: 'tr',
    theme: 'light'
  });

  useEffect(() => {
    setMounted(true);
    if (currentVenue) {
      setSettings(prev => ({
        ...prev,
        menuUrl: `https://order.app/menu/${currentVenue.slug}`
      }));
    }
  }, [currentVenue]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(settings.menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    // Simulate QR download
    alert('QR kod indirildi!');
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">QR Menü ayarları için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Menü</h1>
          <p className="text-gray-500 mt-1">Dijital menünüzü yönetin ve QR kodunuzu özelleştirin</p>
        </div>
        <a
          href={settings.menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Önizleme
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'qr', label: 'QR Kod', icon: QrCode },
          { id: 'design', label: 'Tasarım', icon: Palette },
          { id: 'settings', label: 'Ayarlar', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-orange-600 border-orange-500'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">QR Kodunuz</h3>
            
            {/* QR Code Display */}
            <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center mb-4">
              <div className="w-48 h-48 bg-white rounded-lg shadow-sm flex items-center justify-center border-4 border-gray-200">
                <QrCode className="w-32 h-32 text-gray-800" />
              </div>
            </div>

            {/* URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Menü URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.menuUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                />
                <button
                  onClick={handleCopyUrl}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                PNG
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                SVG
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-2">
          {activeTab === 'qr' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900">QR Kod Ayarları</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">QR Boyutu</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option>256x256 px</option>
                    <option>512x512 px</option>
                    <option>1024x1024 px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hata Düzeltme</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option>Düşük (%7)</option>
                    <option>Orta (%15)</option>
                    <option>Yüksek (%25)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QR Rengi</label>
                <div className="flex gap-3">
                  {['#000000', '#1f2937', '#f97316', '#ef4444', '#3b82f6'].map(color => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        settings.primaryColor === color ? 'border-orange-500 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSettings({ ...settings, primaryColor: color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Logo Ekle</p>
                    <p className="text-sm text-gray-500">QR kodun ortasına logo yerleştir</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, logoEnabled: !settings.logoEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.logoEnabled ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    settings.logoEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
              <h3 className="font-semibold text-gray-900">Menü Tasarımı</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Açık' },
                    { id: 'dark', label: 'Koyu' },
                    { id: 'auto', label: 'Otomatik' }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSettings({ ...settings, theme: theme.id as any })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.theme === theme.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ana Renk</label>
                <div className="flex gap-3">
                  {['#f97316', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        settings.primaryColor === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSettings({ ...settings, primaryColor: color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Görünüm Ayarları</h3>
              
              {[
                { key: 'showPrices', label: 'Fiyatları Göster', desc: 'Ürün fiyatlarını menüde göster', icon: Type },
                { key: 'showImages', label: 'Görselleri Göster', desc: 'Ürün fotoğraflarını göster', icon: Image },
                { key: 'showDescriptions', label: 'Açıklamaları Göster', desc: 'Ürün açıklamalarını göster', icon: Type }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof QRSettings] })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings[item.key as keyof QRSettings] ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      settings[item.key as keyof QRSettings] ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dil</label>
                <select 
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="ru">Русский</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Bugün Tarama', value: '234', change: '+12%' },
          { label: 'Bu Hafta', value: '1,847', change: '+8%' },
          { label: 'Toplam Tarama', value: '45,230', change: '' },
          { label: 'Ort. Oturum Süresi', value: '4:32', change: '+15%' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change && (
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
