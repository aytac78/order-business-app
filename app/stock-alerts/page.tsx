'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { AlertTriangle, Package, Check, X, Bell, Search, Filter, AlertCircle, Clock, ShoppingCart } from 'lucide-react';

interface StockAlert {
  id: string;
  itemName: string;
  type: 'low' | 'out' | 'expiring';
  currentQty: number;
  minQty: number;
  unit: string;
  category: string;
  expiryDate?: string;
  isRead: boolean;
  createdAt: string;
}

const demoAlerts: StockAlert[] = [
  { id: '1', itemName: 'Dana Bonfile', type: 'low', currentQty: 2, minQty: 5, unit: 'kg', category: 'Et', isRead: false, createdAt: new Date().toISOString() },
  { id: '2', itemName: 'Zeytinyağı', type: 'out', currentQty: 0, minQty: 3, unit: 'lt', category: 'Yağ', isRead: false, createdAt: new Date().toISOString() },
  { id: '3', itemName: 'Domates', type: 'expiring', currentQty: 10, minQty: 5, unit: 'kg', category: 'Sebze', expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), isRead: false, createdAt: new Date().toISOString() },
  { id: '4', itemName: 'Tavuk Göğsü', type: 'low', currentQty: 3, minQty: 8, unit: 'kg', category: 'Et', isRead: true, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '5', itemName: 'Kırmızı Biber', type: 'out', currentQty: 0, minQty: 2, unit: 'kg', category: 'Sebze', isRead: true, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: '6', itemName: 'Peynir', type: 'expiring', currentQty: 5, minQty: 3, unit: 'kg', category: 'Süt Ürünleri', expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), isRead: false, createdAt: new Date().toISOString() },
  { id: '7', itemName: 'Un', type: 'low', currentQty: 5, minQty: 10, unit: 'kg', category: 'Kuru Gıda', isRead: true, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
];

const typeConfig = {
  low: { label: 'Düşük Stok', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle, iconColor: 'text-amber-500' },
  out: { label: 'Stok Bitti', color: 'bg-red-100 text-red-700 border-red-300', icon: X, iconColor: 'text-red-500' },
  expiring: { label: 'Son Kullanma', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Clock, iconColor: 'text-purple-500' },
};

export default function StockAlertsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>(demoAlerts);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredAlerts = alerts.filter(a => {
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesRead = !showUnreadOnly || !a.isRead;
    return matchesType && matchesRead;
  });

  const markAsRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  const markAllAsRead = () => setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  const dismissAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const lowCount = alerts.filter(a => a.type === 'low').length;
  const outCount = alerts.filter(a => a.type === 'out').length;
  const expiringCount = alerts.filter(a => a.type === 'expiring').length;

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Stok uyarıları için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Uyarıları</h1>
          <p className="text-gray-500">{currentVenue?.name} • {unreadCount} okunmamış uyarı</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-xl">
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Bell className="w-5 h-5 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{alerts.length}</p><p className="text-xs text-gray-500">Toplam Uyarı</p></div>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-700">{lowCount}</p><p className="text-xs text-amber-600">Düşük Stok</p></div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><X className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-700">{outCount}</p><p className="text-xs text-red-600">Stok Bitti</p></div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-purple-700">{expiringCount}</p><p className="text-xs text-purple-600">Son Kullanma</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {['all', 'low', 'out', 'expiring'].map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} className={`px-4 py-2 rounded-lg font-medium text-sm ${typeFilter === type ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {type === 'all' ? 'Tümü' : typeConfig[type as keyof typeof typeConfig].label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showUnreadOnly} onChange={(e) => setShowUnreadOnly(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm">Sadece okunmamış</span>
        </label>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="divide-y">
          {filteredAlerts.map(alert => {
            const config = typeConfig[alert.type];
            const Icon = config.icon;
            return (
              <div key={alert.id} className={`p-4 hover:bg-gray-50 ${!alert.isRead ? 'bg-orange-50/30' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{alert.itemName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>{config.label}</span>
                      {!alert.isRead && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {alert.type === 'expiring' 
                        ? `Son kullanma: ${new Date(alert.expiryDate!).toLocaleDateString('tr-TR')} • Mevcut: ${alert.currentQty} ${alert.unit}`
                        : `Mevcut: ${alert.currentQty} ${alert.unit} • Minimum: ${alert.minQty} ${alert.unit}`
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{alert.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => dismissAlert(alert.id)} className="p-2 hover:bg-gray-100 rounded-lg" title="Kapat">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                    {!alert.isRead && (
                      <button onClick={() => markAsRead(alert.id)} className="p-2 hover:bg-gray-100 rounded-lg" title="Okundu">
                        <Check className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
                      <ShoppingCart className="w-3 h-3 inline mr-1" />Sipariş Ver
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredAlerts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Tüm stoklar yeterli seviyede</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
