'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import {
  AlertTriangle,
  Package,
  TrendingDown,
  ShoppingCart,
  Bell,
  Settings,
  Check,
  X,
  Clock,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';

interface StockAlert {
  id: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier: string;
  lastOrdered?: string;
  priority: 'critical' | 'low' | 'warning';
  createdAt: string;
}

const demoAlerts: StockAlert[] = [
  { id: '1', productName: 'Zeytinyağı', category: 'Yağ', currentStock: 2, minStock: 10, unit: 'L', supplier: 'Tariş', priority: 'critical', createdAt: '2025-01-15T10:00:00Z' },
  { id: '2', productName: 'Limon', category: 'Sebze', currentStock: 5, minStock: 20, unit: 'kg', supplier: 'Bodrum Hal', priority: 'critical', createdAt: '2025-01-15T09:30:00Z' },
  { id: '3', productName: 'Roka', category: 'Sebze', currentStock: 3, minStock: 15, unit: 'kg', supplier: 'Bodrum Hal', priority: 'critical', createdAt: '2025-01-15T09:00:00Z' },
  { id: '4', productName: 'Levrek', category: 'Balık', currentStock: 8, minStock: 15, unit: 'kg', supplier: 'Güllük Balık', priority: 'low', createdAt: '2025-01-15T08:00:00Z' },
  { id: '5', productName: 'Karides', category: 'Balık', currentStock: 4, minStock: 10, unit: 'kg', supplier: 'Güllük Balık', priority: 'low', createdAt: '2025-01-14T18:00:00Z' },
  { id: '6', productName: 'Rakı', category: 'Alkol', currentStock: 12, minStock: 20, unit: 'şişe', supplier: 'Tekel', priority: 'warning', createdAt: '2025-01-14T15:00:00Z' },
  { id: '7', productName: 'Beyaz Şarap', category: 'Alkol', currentStock: 8, minStock: 15, unit: 'şişe', supplier: 'Kavaklidere', priority: 'warning', createdAt: '2025-01-14T14:00:00Z' },
];

export default function StockAlertsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>(demoAlerts);
  const [filter, setFilter] = useState<'all' | 'critical' | 'low' | 'warning'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.priority === filter);

  const stats = {
    critical: alerts.filter(a => a.priority === 'critical').length,
    low: alerts.filter(a => a.priority === 'low').length,
    warning: alerts.filter(a => a.priority === 'warning').length,
  };

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleOrder = (alert: StockAlert) => {
    // Simulate order
    window.alert(`${alert.productName} için ${alert.supplier}'a sipariş oluşturuldu!`);
  };

  const getPriorityBadge = (priority: StockAlert['priority']) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">KRİTİK</span>;
      case 'low':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">DÜŞÜK</span>;
      case 'warning':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">UYARI</span>;
    }
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Uyarıları</h1>
          <p className="text-gray-500 mt-1">Kritik stok seviyelerini takip edin</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
          <Settings className="w-4 h-4" />
          Uyarı Ayarları
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Kritik Seviye</p>
              <p className="text-4xl font-bold mt-2">{stats.critical}</p>
              <p className="text-red-200 text-sm mt-1">Acil sipariş gerekli</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Düşük Stok</p>
              <p className="text-4xl font-bold mt-2">{stats.low}</p>
              <p className="text-orange-200 text-sm mt-1">Yakında sipariş ver</p>
            </div>
            <TrendingDown className="w-12 h-12 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Uyarı</p>
              <p className="text-4xl font-bold mt-2">{stats.warning}</p>
              <p className="text-yellow-200 text-sm mt-1">Takipte</p>
            </div>
            <Bell className="w-12 h-12 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'critical', label: 'Kritik' },
          { id: 'low', label: 'Düşük' },
          { id: 'warning', label: 'Uyarı' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              filter === f.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`bg-white rounded-xl border p-4 ${
              alert.priority === 'critical' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  alert.priority === 'critical' ? 'bg-red-100' : 
                  alert.priority === 'low' ? 'bg-orange-100' : 'bg-yellow-100'
                }`}>
                  <Package className={`w-6 h-6 ${
                    alert.priority === 'critical' ? 'text-red-600' : 
                    alert.priority === 'low' ? 'text-orange-600' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{alert.productName}</h3>
                    {getPriorityBadge(alert.priority)}
                  </div>
                  <p className="text-sm text-gray-500">{alert.category} • {alert.supplier}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{alert.currentStock}</p>
                  <p className="text-xs text-gray-500">Mevcut ({alert.unit})</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-400">{alert.minStock}</p>
                  <p className="text-xs text-gray-500">Minimum ({alert.unit})</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOrder(alert)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Sipariş Ver
                  </button>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Tüm stoklar yeterli seviyede!</p>
          </div>
        )}
      </div>
    </div>
  );
}
