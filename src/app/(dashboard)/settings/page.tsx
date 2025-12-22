'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import {
  Settings,
  Building,
  Clock,
  Users,
  CreditCard,
  Bell,
  Printer,
  Globe,
  Shield,
  Palette,
  Save,
  Camera,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ChevronRight,
  Key,
  Wifi
} from 'lucide-react';

type SettingsTab = 'general' | 'hours' | 'users' | 'payments' | 'notifications' | 'integrations';

interface WorkingHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'waiter' | 'kitchen' | 'cashier';
  status: 'active' | 'inactive';
  avatar?: string;
}

const initialHours: WorkingHours[] = [
  { day: 'Pazartesi', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'Salı', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'Çarşamba', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'Perşembe', isOpen: true, openTime: '11:00', closeTime: '23:00' },
  { day: 'Cuma', isOpen: true, openTime: '11:00', closeTime: '00:00' },
  { day: 'Cumartesi', isOpen: true, openTime: '11:00', closeTime: '00:00' },
  { day: 'Pazar', isOpen: true, openTime: '11:00', closeTime: '23:00' },
];

const initialUsers: User[] = [
  { id: '1', name: 'Aytaç Gör', email: 'aytac@order.com', role: 'owner', status: 'active' },
  { id: '2', name: 'Mehmet Yılmaz', email: 'mehmet@order.com', role: 'manager', status: 'active' },
  { id: '3', name: 'Ahmet Kaya', email: 'ahmet@order.com', role: 'waiter', status: 'active' },
  { id: '4', name: 'Ayşe Demir', email: 'ayse@order.com', role: 'waiter', status: 'active' },
  { id: '5', name: 'Ali Şahin', email: 'ali@order.com', role: 'kitchen', status: 'active' },
  { id: '6', name: 'Fatma Öztürk', email: 'fatma@order.com', role: 'cashier', status: 'inactive' },
];

const roleLabels: Record<string, { label: string; color: string }> = {
  owner: { label: 'Sahip', color: 'bg-purple-100 text-purple-700' },
  manager: { label: 'Müdür', color: 'bg-blue-100 text-blue-700' },
  waiter: { label: 'Garson', color: 'bg-green-100 text-green-700' },
  kitchen: { label: 'Mutfak', color: 'bg-orange-100 text-orange-700' },
  cashier: { label: 'Kasiyer', color: 'bg-amber-100 text-amber-700' },
};

const tabs: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'general', label: 'Genel Bilgiler', icon: Building },
  { id: 'hours', label: 'Çalışma Saatleri', icon: Clock },
  { id: 'users', label: 'Kullanıcılar', icon: Users },
  { id: 'payments', label: 'Ödeme Yöntemleri', icon: CreditCard },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'integrations', label: 'Entegrasyonlar', icon: Wifi },
];

export default function SettingsPage() {
  const { currentVenue } = useVenueStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hours, setHours] = useState<WorkingHours[]>(initialHours);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  // General form state
  const [venueData, setVenueData] = useState({
    name: 'ORDER Bodrum Marina',
    type: 'Restoran',
    address: 'Neyzen Tevfik Cad. No:123, Bodrum Marina',
    city: 'Bodrum',
    phone: '+90 252 316 1234',
    email: 'info@orderbodrum.com',
    website: 'www.orderbodrum.com',
    instagram: '@orderbodrum',
    facebook: 'orderbodrum',
    twitter: '@orderbodrum',
    taxNumber: '1234567890',
    taxOffice: 'Bodrum VD',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDay = (index: number) => {
    setHours(prev => prev.map((h, i) => 
      i === index ? { ...h, isOpen: !h.isOpen } : h
    ));
  };

  const updateHours = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours(prev => prev.map((h, i) => 
      i === index ? { ...h, [field]: value } : h
    ));
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Ayarlar</h2>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Genel Bilgiler</h2>
                <p className="text-gray-500">Mekan bilgilerini düzenleyin</p>
              </div>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Kaydedildi' : 'Kaydet'}
              </button>
            </div>

            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                  🍽️
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <Camera className="w-4 h-4" />
                  Logo Yükle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı</label>
                  <input
                    type="text"
                    value={venueData.name}
                    onChange={(e) => setVenueData({ ...venueData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Tipi</label>
                  <select
                    value={venueData.type}
                    onChange={(e) => setVenueData({ ...venueData, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option>Restoran</option>
                    <option>Kafe</option>
                    <option>Bar</option>
                    <option>Beach Club</option>
                    <option>Gece Kulübü</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <textarea
                    value={venueData.address}
                    onChange={(e) => setVenueData({ ...venueData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={venueData.city}
                    onChange={(e) => setVenueData({ ...venueData, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={venueData.phone}
                      onChange={(e) => setVenueData({ ...venueData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={venueData.email}
                      onChange={(e) => setVenueData({ ...venueData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={venueData.website}
                      onChange={(e) => setVenueData({ ...venueData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={venueData.instagram}
                      onChange={(e) => setVenueData({ ...venueData, instagram: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                    <input
                      type="text"
                      value={venueData.facebook}
                      onChange={(e) => setVenueData({ ...venueData, facebook: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                    <input
                      type="text"
                      value={venueData.twitter}
                      onChange={(e) => setVenueData({ ...venueData, twitter: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Info */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-900 mb-4">Vergi Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vergi No</label>
                  <input
                    type="text"
                    value={venueData.taxNumber}
                    onChange={(e) => setVenueData({ ...venueData, taxNumber: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={venueData.taxOffice}
                    onChange={(e) => setVenueData({ ...venueData, taxOffice: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours */}
        {activeTab === 'hours' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Çalışma Saatleri</h2>
                <p className="text-gray-500">Açılış ve kapanış saatlerini ayarlayın</p>
              </div>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Kaydedildi' : 'Kaydet'}
              </button>
            </div>

            <div className="space-y-3">
              {hours.map((day, index) => (
                <div
                  key={day.day}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    day.isOpen ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="w-28">
                    <span className={`font-medium ${day.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                      {day.day}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleDay(index)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      day.isOpen ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      day.isOpen ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  {day.isOpen ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateHours(index, 'openTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateHours(index, 'closeTime', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400">Kapalı</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Kullanıcılar</h2>
                <p className="text-gray-500">{users.length} kullanıcı</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
                <Plus className="w-4 h-4" />
                Kullanıcı Ekle
              </button>
            </div>

            <div className="space-y-3">
              {users.map(user => {
                const role = roleLabels[user.role];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${role.color}`}>
                      {role.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payments */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ödeme Yöntemleri</h2>
                <p className="text-gray-500">Kabul edilen ödeme türleri</p>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>

            <div className="space-y-4">
              {[
                { id: 'cash', name: 'Nakit', enabled: true },
                { id: 'card', name: 'Kredi/Banka Kartı', enabled: true },
                { id: 'multinet', name: 'Multinet', enabled: true },
                { id: 'sodexo', name: 'Sodexo', enabled: true },
                { id: 'ticket', name: 'Ticket', enabled: false },
                { id: 'mobile', name: 'Mobil Ödeme', enabled: true },
              ].map(method => (
                <div key={method.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-900">{method.name}</span>
                  <button className={`w-12 h-6 rounded-full transition-colors ${
                    method.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      method.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bildirimler</h2>
                <p className="text-gray-500">Bildirim tercihleriniz</p>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>

            <div className="space-y-4">
              {[
                { id: 'new_order', name: 'Yeni Sipariş', desc: 'Yeni sipariş geldiğinde', enabled: true },
                { id: 'order_ready', name: 'Sipariş Hazır', desc: 'Mutfak siparişi hazırladığında', enabled: true },
                { id: 'low_stock', name: 'Düşük Stok', desc: 'Stok kritik seviyeye düştüğünde', enabled: true },
                { id: 'reservation', name: 'Yeni Rezervasyon', desc: 'Yeni rezervasyon geldiğinde', enabled: true },
                { id: 'daily_report', name: 'Günlük Rapor', desc: 'Her gün sonu özet raporu', enabled: false },
              ].map(notif => (
                <div key={notif.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{notif.name}</p>
                    <p className="text-sm text-gray-500">{notif.desc}</p>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-colors ${
                    notif.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      notif.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeTab === 'integrations' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Entegrasyonlar</h2>
                <p className="text-gray-500">Harici sistem bağlantıları</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'pos', name: 'POS Cihazı', desc: 'Ingenico iCT250', connected: true },
                { id: 'printer', name: 'Yazıcı', desc: 'Epson TM-T88VI', connected: true },
                { id: 'kitchen_display', name: 'Mutfak Ekranı', desc: '2 ekran bağlı', connected: true },
                { id: 'accounting', name: 'Muhasebe', desc: 'Logo Tiger', connected: false },
                { id: 'delivery', name: 'Paket Servis', desc: 'Yemeksepeti, Getir', connected: false },
              ].map(integration => (
                <div key={integration.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      integration.connected ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Wifi className={`w-5 h-5 ${integration.connected ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{integration.name}</p>
                      <p className="text-sm text-gray-500">{integration.desc}</p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    integration.connected
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}>
                    {integration.connected ? 'Ayarlar' : 'Bağla'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
