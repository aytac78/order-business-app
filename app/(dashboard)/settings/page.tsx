'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import {
  Settings,
  Building2,
  Clock,
  CreditCard,
  Bell,
  Palette,
  Shield,
  Users,
  QrCode,
  Globe,
  Printer,
  Save,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Lock,
  Key,
  Smartphone,
  Mail,
  MapPin,
  Phone,
  Image
} from 'lucide-react';

interface VenueSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  taxRate: number;
  serviceCharge: number;
  autoAcceptOrders: boolean;
  notificationSounds: boolean;
  themeColor: string;
  reservationEnabled: boolean;
  qrMenuEnabled: boolean;
  onlineOrderingEnabled: boolean;
  minOrderAmount: number;
}

interface WorkingHours {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

interface PinSettings {
  kitchenPin: string;
  waiterPin: string;
  posPin: string;
  receptionPin: string;
  managerPin: string;
}

export default function SettingsPage() {
  const { currentVenue } = useVenueStore();
  const [activeTab, setActiveTab] = useState('general');
  const [mounted, setMounted] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState<VenueSettings>({
    name: currentVenue?.name || "Nihal's Break Point",
    address: currentVenue?.address || 'Bodrum Marina, Bodrum',
    phone: currentVenue?.phone || '+90 252 316 1234',
    email: currentVenue?.email || 'info@nihalsbreakpoint.com',
    currency: currentVenue?.currency || 'TRY',
    timezone: currentVenue?.timezone || 'Europe/Istanbul',
    taxRate: 8,
    serviceCharge: 10,
    autoAcceptOrders: true,
    notificationSounds: true,
    themeColor: '#f97316',
    reservationEnabled: true,
    qrMenuEnabled: true,
    onlineOrderingEnabled: true,
    minOrderAmount: 100
  });

  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
    { day: 'Pazartesi', isOpen: true, open: '10:00', close: '23:00' },
    { day: 'Salı', isOpen: true, open: '10:00', close: '23:00' },
    { day: 'Çarşamba', isOpen: true, open: '10:00', close: '23:00' },
    { day: 'Perşembe', isOpen: true, open: '10:00', close: '23:00' },
    { day: 'Cuma', isOpen: true, open: '10:00', close: '00:00' },
    { day: 'Cumartesi', isOpen: true, open: '10:00', close: '00:00' },
    { day: 'Pazar', isOpen: true, open: '10:00', close: '22:00' },
  ]);

  const [pinSettings, setPinSettings] = useState<PinSettings>({
    kitchenPin: '1234',
    waiterPin: '1234',
    posPin: '1234',
    receptionPin: '1234',
    managerPin: '1234'
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [editingPin, setEditingPin] = useState<keyof PinSettings | null>(null);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    // Burada Supabase'e kayıt yapılacak
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePinChange = (key: keyof PinSettings) => {
    setEditingPin(key);
    setNewPin('');
    setShowPinModal(true);
  };

  const savePinChange = () => {
    if (editingPin && newPin.length >= 4) {
      setPinSettings(prev => ({ ...prev, [editingPin]: newPin }));
      setShowPinModal(false);
      setEditingPin(null);
      setNewPin('');
    }
  };

  const tabs = [
    { id: 'general', name: 'Genel', icon: Building2 },
    { id: 'hours', name: 'Çalışma Saatleri', icon: Clock },
    { id: 'payments', name: 'Ödeme', icon: CreditCard },
    { id: 'notifications', name: 'Bildirimler', icon: Bell },
    { id: 'security', name: 'Güvenlik & PIN', icon: Shield },
    { id: 'integrations', name: 'Entegrasyonlar', icon: Globe },
    { id: 'appearance', name: 'Görünüm', icon: Palette },
  ];

  const pinLabels: Record<keyof PinSettings, string> = {
    kitchenPin: 'Mutfak Paneli',
    waiterPin: 'Garson Paneli',
    posPin: 'Kasa/POS',
    receptionPin: 'Resepsiyon',
    managerPin: 'Yönetici Çıkış'
  };

  if (!mounted) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />
    );
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Ayarlar için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-500">{currentVenue.name} mekan ayarları</p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          {saveSuccess ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saveSuccess ? 'Kaydedildi!' : 'Kaydet'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            
            {/* Genel */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Genel Bilgiler
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mekan Adı
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adres
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-posta
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Para Birimi
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="TRY">₺ Türk Lirası (TRY)</option>
                      <option value="USD">$ ABD Doları (USD)</option>
                      <option value="EUR">€ Euro (EUR)</option>
                    </select>
                  </div>
                </div>

                {/* Features */}
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Özellikler</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <QrCode className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">QR Menü</p>
                          <p className="text-sm text-gray-500">Müşteriler QR kod ile menüyü görebilir</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.qrMenuEnabled}
                        onChange={(e) => setSettings({ ...settings, qrMenuEnabled: e.target.checked })}
                        className="w-5 h-5 text-orange-500 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Online Sipariş</p>
                          <p className="text-sm text-gray-500">Müşteriler mobil uygulama üzerinden sipariş verebilir</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.onlineOrderingEnabled}
                        onChange={(e) => setSettings({ ...settings, onlineOrderingEnabled: e.target.checked })}
                        className="w-5 h-5 text-orange-500 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Rezervasyon</p>
                          <p className="text-sm text-gray-500">Müşteriler online rezervasyon yapabilir</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.reservationEnabled}
                        onChange={(e) => setSettings({ ...settings, reservationEnabled: e.target.checked })}
                        className="w-5 h-5 text-orange-500 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Çalışma Saatleri */}
            {activeTab === 'hours' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Çalışma Saatleri
                </h2>

                <div className="space-y-3">
                  {workingHours.map((day, index) => (
                    <div key={day.day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-28">
                        <span className="font-medium text-gray-900">{day.day}</span>
                      </div>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.isOpen}
                          onChange={(e) => {
                            const newHours = [...workingHours];
                            newHours[index].isOpen = e.target.checked;
                            setWorkingHours(newHours);
                          }}
                          className="w-5 h-5 text-orange-500 rounded"
                        />
                        <span className="text-sm text-gray-600">Açık</span>
                      </label>

                      {day.isOpen && (
                        <>
                          <input
                            type="time"
                            value={day.open}
                            onChange={(e) => {
                              const newHours = [...workingHours];
                              newHours[index].open = e.target.value;
                              setWorkingHours(newHours);
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={day.close}
                            onChange={(e) => {
                              const newHours = [...workingHours];
                              newHours[index].close = e.target.value;
                              setWorkingHours(newHours);
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </>
                      )}

                      {!day.isOpen && (
                        <span className="text-gray-400">Kapalı</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ödeme */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Ödeme Ayarları
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KDV Oranı (%)
                    </label>
                    <input
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servis Ücreti (%)
                    </label>
                    <input
                      type="number"
                      value={settings.serviceCharge}
                      onChange={(e) => setSettings({ ...settings, serviceCharge: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Sipariş Tutarı (₺)
                    </label>
                    <input
                      type="number"
                      value={settings.minOrderAmount}
                      onChange={(e) => setSettings({ ...settings, minOrderAmount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Ödeme Yöntemleri</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['Nakit', 'Kredi Kartı', 'TiT Pay', 'Multinet', 'Sodexo', 'Ticket'].map(method => (
                      <label key={method} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-500 rounded" />
                        <span className="text-sm text-gray-700">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bildirimler */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Bildirim Ayarları
                </h2>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Yeni Sipariş Bildirimi</p>
                      <p className="text-sm text-gray-500">Yeni sipariş geldiğinde ses çal</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notificationSounds}
                      onChange={(e) => setSettings({ ...settings, notificationSounds: e.target.checked })}
                      className="w-5 h-5 text-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Otomatik Sipariş Onayı</p>
                      <p className="text-sm text-gray-500">QR siparişleri otomatik onayla</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoAcceptOrders}
                      onChange={(e) => setSettings({ ...settings, autoAcceptOrders: e.target.checked })}
                      className="w-5 h-5 text-orange-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Rezervasyon Bildirimi</p>
                      <p className="text-sm text-gray-500">Yeni rezervasyon geldiğinde bildir</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-500 rounded" />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Stok Uyarısı</p>
                      <p className="text-sm text-gray-500">Stok azaldığında uyar</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-500 rounded" />
                  </label>
                </div>
              </div>
            )}

            {/* Güvenlik & PIN */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Güvenlik & PIN Kodları
                </h2>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Önemli</p>
                    <p className="text-sm text-amber-700">
                      PIN kodları panel girişleri ve yönetici işlemleri için kullanılır. 
                      Güvenliğiniz için PIN kodlarınızı düzenli olarak değiştirin.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(Object.keys(pinSettings) as Array<keyof PinSettings>).map(key => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Key className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{pinLabels[key]}</p>
                          <p className="text-sm text-gray-500">PIN: {'•'.repeat(pinSettings[key].length)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePinChange(key)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Değiştir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entegrasyonlar */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Entegrasyonlar
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">TiT</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">TiT Pay</p>
                        <p className="text-sm text-gray-500">QR kod ile ödeme sistemi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Aktif</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Printer className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Yazıcılar</p>
                        <p className="text-sm text-gray-500">Mutfak ve kasa yazıcıları</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">2 Yazıcı</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Yemeksepeti</p>
                        <p className="text-sm text-gray-500">Online sipariş entegrasyonu</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">Yakında</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-400 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Getir Yemek</p>
                        <p className="text-sm text-gray-500">Online sipariş entegrasyonu</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">Yakında</span>
                  </div>
                </div>
              </div>
            )}

            {/* Görünüm */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                  Görünüm Ayarları
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema Rengi
                  </label>
                  <div className="flex gap-3">
                    {['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'].map(color => (
                      <button
                        key={color}
                        onClick={() => setSettings({ ...settings, themeColor: color })}
                        className={`w-10 h-10 rounded-full transition-transform ${
                          settings.themeColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">Logo yüklemek için tıklayın veya sürükleyin</p>
                    <p className="text-xs text-gray-400">PNG, JPG (max. 2MB)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PIN Change Modal */}
      {showPinModal && editingPin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">PIN Değiştir</h2>
              <button onClick={() => setShowPinModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600">{pinLabels[editingPin]} için yeni PIN girin</p>
              
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                      newPin.length > i ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    {newPin.length > i ? '●' : ''}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'clear') setNewPin('');
                      else if (key === 'back') setNewPin(prev => prev.slice(0, -1));
                      else if (newPin.length < 4) setNewPin(prev => prev + key);
                    }}
                    className={`py-4 rounded-xl font-bold text-xl transition-colors ${
                      key === 'clear'
                        ? 'bg-red-100 hover:bg-red-200 text-red-600 text-sm'
                        : key === 'back'
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {key === 'clear' ? 'Temizle' : key === 'back' ? '←' : key}
                  </button>
                ))}
              </div>

              <button
                onClick={savePinChange}
                disabled={newPin.length < 4}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
