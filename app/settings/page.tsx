'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useUIStore } from '@/stores';
import { Settings, Building2, Clock, CreditCard, Bell, Palette, Globe, Shield, Printer, QrCode, Save, Check, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { currentVenue } = useVenueStore();
  const { theme, setTheme, language, setLanguage } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    venueName: currentVenue?.name || 'ORDER Restaurant',
    phone: currentVenue?.phone || '0252 123 4567',
    email: currentVenue?.email || 'info@order.com',
    address: currentVenue?.address || 'Bodrum Marina, Muğla',
    taxRate: 8,
    serviceCharge: 10,
    minOrder: 100,
    autoAcceptOrders: true,
    notificationSound: true,
    reservationEnabled: true,
    qrMenuEnabled: true,
    onlineOrderingEnabled: true,
    workingHours: {
      weekday: { open: '10:00', close: '23:00' },
      weekend: { open: '10:00', close: '00:00' }
    }
  });

  useEffect(() => { setMounted(true); }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Ayarlar için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-500">{currentVenue?.name} • İşletme ayarları</p>
        </div>
        <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all ${saved ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
          {saved ? <><Check className="w-4 h-4" />Kaydedildi</> : <><Save className="w-4 h-4" />Kaydet</>}
        </button>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-orange-600" /></div>
          <div><h2 className="font-bold">İşletme Bilgileri</h2><p className="text-sm text-gray-500">Temel işletme bilgileri</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
            <input type="text" value={settings.venueName} onChange={(e) => setSettings({ ...settings, venueName: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="tel" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <input type="text" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-600" /></div>
          <div><h2 className="font-bold">Çalışma Saatleri</h2><p className="text-sm text-gray-500">Açılış ve kapanış saatleri</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-gray-700 mb-3">Hafta İçi</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Açılış</label>
                <input type="time" value={settings.workingHours.weekday.open} onChange={(e) => setSettings({ ...settings, workingHours: { ...settings.workingHours, weekday: { ...settings.workingHours.weekday, open: e.target.value } } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <span className="text-gray-400 mt-5">-</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Kapanış</label>
                <input type="time" value={settings.workingHours.weekday.close} onChange={(e) => setSettings({ ...settings, workingHours: { ...settings.workingHours, weekday: { ...settings.workingHours.weekday, close: e.target.value } } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-3">Hafta Sonu</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Açılış</label>
                <input type="time" value={settings.workingHours.weekend.open} onChange={(e) => setSettings({ ...settings, workingHours: { ...settings.workingHours, weekend: { ...settings.workingHours.weekend, open: e.target.value } } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <span className="text-gray-400 mt-5">-</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Kapanış</label>
                <input type="time" value={settings.workingHours.weekend.close} onChange={(e) => setSettings({ ...settings, workingHours: { ...settings.workingHours, weekend: { ...settings.workingHours.weekend, close: e.target.value } } })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-green-600" /></div>
          <div><h2 className="font-bold">Ödeme Ayarları</h2><p className="text-sm text-gray-500">Vergi ve servis bedeli</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
            <input type="number" min="0" max="100" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servis Bedeli (%)</label>
            <input type="number" min="0" max="100" value={settings.serviceCharge} onChange={(e) => setSettings({ ...settings, serviceCharge: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min. Sipariş (₺)</label>
            <input type="number" min="0" value={settings.minOrder} onChange={(e) => setSettings({ ...settings, minOrder: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-xl" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Settings className="w-5 h-5 text-purple-600" /></div>
          <div><h2 className="font-bold">Özellikler</h2><p className="text-sm text-gray-500">Sistem özellikleri</p></div>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-gray-600" />
              <div><p className="font-medium">QR Menü</p><p className="text-sm text-gray-500">Müşteriler QR kod ile menüyü görebilir</p></div>
            </div>
            <input type="checkbox" checked={settings.qrMenuEnabled} onChange={(e) => setSettings({ ...settings, qrMenuEnabled: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div><p className="font-medium">Sipariş Bildirimleri</p><p className="text-sm text-gray-500">Yeni siparişlerde ses çal</p></div>
            </div>
            <input type="checkbox" checked={settings.notificationSound} onChange={(e) => setSettings({ ...settings, notificationSound: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-gray-600" />
              <div><p className="font-medium">Otomatik Sipariş Onayı</p><p className="text-sm text-gray-500">Siparişleri otomatik onayla</p></div>
            </div>
            <input type="checkbox" checked={settings.autoAcceptOrders} onChange={(e) => setSettings({ ...settings, autoAcceptOrders: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-600" />
              <div><p className="font-medium">Online Sipariş</p><p className="text-sm text-gray-500">Web sitesinden sipariş alma</p></div>
            </div>
            <input type="checkbox" checked={settings.onlineOrderingEnabled} onChange={(e) => setSettings({ ...settings, onlineOrderingEnabled: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
          </label>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center"><Palette className="w-5 h-5 text-pink-600" /></div>
          <div><h2 className="font-bold">Görünüm</h2><p className="text-sm text-gray-500">Tema ve dil ayarları</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="w-full px-4 py-2 border rounded-xl">
              <option value="light">Açık</option>
              <option value="dark">Koyu</option>
              <option value="system">Sistem</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dil</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2 border rounded-xl">
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="it">Italiano</option>
              <option value="de">Deutsch</option>
              <option value="ar">العربية</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
