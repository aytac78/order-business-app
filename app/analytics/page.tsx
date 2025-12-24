'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingBag, CreditCard, Clock, Calendar, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

const revenueData = [
  { day: 'Pzt', revenue: 12500, orders: 45 },
  { day: 'Sal', revenue: 14200, orders: 52 },
  { day: 'Çar', revenue: 11800, orders: 41 },
  { day: 'Per', revenue: 15600, orders: 58 },
  { day: 'Cum', revenue: 22400, orders: 78 },
  { day: 'Cmt', revenue: 28900, orders: 95 },
  { day: 'Paz', revenue: 24500, orders: 82 },
];

const topProducts = [
  { name: 'Karışık Izgara', orders: 156, revenue: 54600 },
  { name: 'Izgara Levrek', orders: 124, revenue: 39680 },
  { name: 'Adana Kebap', orders: 98, revenue: 19600 },
  { name: 'Künefe', orders: 87, revenue: 12180 },
  { name: 'Rakı (70cl)', orders: 72, revenue: 32400 },
];

const hourlyData = [
  { hour: '12:00', orders: 8 }, { hour: '13:00', orders: 22 }, { hour: '14:00', orders: 15 },
  { hour: '15:00', orders: 6 }, { hour: '16:00', orders: 4 }, { hour: '17:00', orders: 8 },
  { hour: '18:00', orders: 18 }, { hour: '19:00', orders: 35 }, { hour: '20:00', orders: 42 },
  { hour: '21:00', orders: 38 }, { hour: '22:00', orders: 25 }, { hour: '23:00', orders: 12 },
];

export default function AnalyticsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => { setMounted(true); }, []);

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const maxHourlyOrders = Math.max(...hourlyData.map(d => d.orders));

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Analitik için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analitik</h1>
          <p className="text-gray-500">{currentVenue?.name} • Detaylı performans analizi</p>
        </div>
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {['day', 'week', 'month', 'year'].map(range => (
            <button key={range} onClick={() => setDateRange(range)} className={`px-4 py-2 rounded-lg font-medium text-sm ${dateRange === range ? 'bg-white shadow' : ''}`}>
              {range === 'day' ? 'Bugün' : range === 'week' ? 'Hafta' : range === 'month' ? 'Ay' : 'Yıl'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <span className="flex items-center gap-1 text-sm text-green-600"><ArrowUp className="w-4 h-4" />+12.5%</span>
          </div>
          <p className="text-2xl font-bold">₺129,900</p>
          <p className="text-sm text-gray-500">Toplam Ciro</p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-sm text-green-600"><ArrowUp className="w-4 h-4" />+8.3%</span>
          </div>
          <p className="text-2xl font-bold">451</p>
          <p className="text-sm text-gray-500">Toplam Sipariş</p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="flex items-center gap-1 text-sm text-red-600"><ArrowDown className="w-4 h-4" />-2.1%</span>
          </div>
          <p className="text-2xl font-bold">1,245</p>
          <p className="text-sm text-gray-500">Müşteri Sayısı</p>
        </div>
        <div className="bg-white rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="flex items-center gap-1 text-sm text-green-600"><ArrowUp className="w-4 h-4" />+5.7%</span>
          </div>
          <p className="text-2xl font-bold">₺288</p>
          <p className="text-sm text-gray-500">Ort. Sipariş</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-bold mb-6">Haftalık Ciro</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {revenueData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{d.day}</p>
                <p className="text-xs font-medium">₺{(d.revenue / 1000).toFixed(1)}k</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-bold mb-6">Saatlik Sipariş Dağılımı</h2>
          <div className="flex items-end justify-between h-48 gap-1">
            {hourlyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '140px' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all" style={{ height: `${(d.orders / maxHourlyOrders) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2 -rotate-45">{d.hour.split(':')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-bold mb-4">En Çok Satan Ürünler</h2>
          <div className="space-y-4">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(product.orders / topProducts[0].orders) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">₺{product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{product.orders} sipariş</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Types */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-bold mb-4">Sipariş Türleri</h2>
          <div className="space-y-4">
            {[
              { type: 'Masada', percent: 65, color: 'bg-blue-500', count: 293 },
              { type: 'Paket', percent: 20, color: 'bg-purple-500', count: 90 },
              { type: 'Teslimat', percent: 10, color: 'bg-green-500', count: 45 },
              { type: 'QR Sipariş', percent: 5, color: 'bg-orange-500', count: 23 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="w-24">{item.type}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
                <span className="w-12 text-right font-medium">{item.percent}%</span>
                <span className="w-16 text-right text-sm text-gray-500">{item.count}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">32 dk</p>
              <p className="text-sm text-gray-500">Ort. Servis Süresi</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">4.7 ⭐</p>
              <p className="text-sm text-gray-500">Müşteri Puanı</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
