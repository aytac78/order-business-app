'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { Receipt, TrendingUp, TrendingDown, Calendar, Download, Filter, CreditCard, Users, ShoppingBag, Clock, AlertCircle } from 'lucide-react';

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
  avgOrder: number;
  customers: number;
}

const last7Days: DailyData[] = [
  { date: '2025-01-15', revenue: 18450, orders: 47, avgOrder: 392, customers: 38 },
  { date: '2025-01-14', revenue: 21200, orders: 54, avgOrder: 393, customers: 45 },
  { date: '2025-01-13', revenue: 15800, orders: 41, avgOrder: 385, customers: 32 },
  { date: '2025-01-12', revenue: 24500, orders: 62, avgOrder: 395, customers: 52 },
  { date: '2025-01-11', revenue: 26800, orders: 68, avgOrder: 394, customers: 58 },
  { date: '2025-01-10', revenue: 19200, orders: 49, avgOrder: 392, customers: 41 },
  { date: '2025-01-09', revenue: 17600, orders: 45, avgOrder: 391, customers: 36 },
];

const topProducts = [
  { name: 'Karışık Izgara', quantity: 145, revenue: 50750 },
  { name: 'Izgara Levrek', quantity: 98, revenue: 31360 },
  { name: 'Adana Kebap', quantity: 87, revenue: 17400 },
  { name: 'Rakı (70cl)', quantity: 76, revenue: 34200 },
  { name: 'Künefe', quantity: 65, revenue: 9100 },
];

const paymentBreakdown = [
  { method: 'Kredi Kartı', amount: 89450, percentage: 62 },
  { method: 'Nakit', amount: 35780, percentage: 25 },
  { method: 'TiT Pay', amount: 11590, percentage: 8 },
  { method: 'Yemek Kartı', amount: 7180, percentage: 5 },
];

export default function ReportsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => { setMounted(true); }, []);

  const totalRevenue = last7Days.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = last7Days.reduce((sum, d) => sum + d.orders, 0);
  const totalCustomers = last7Days.reduce((sum, d) => sum + d.customers, 0);
  const avgOrderValue = Math.round(totalRevenue / totalOrders);

  const maxRevenue = Math.max(...last7Days.map(d => d.revenue));

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Raporlar için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Raporlar</h1>
          <p className="text-gray-500">{currentVenue?.name}</p>
        </div>
        <div className="flex gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="px-4 py-2 border rounded-xl">
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="year">Bu Yıl</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
            <Download className="w-4 h-4" />Rapor İndir
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold">₺{totalRevenue.toLocaleString()}</p><p className="text-xs text-white/80">Toplam Ciro</p></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-white/80"><TrendingUp className="w-3 h-3" />+12.5% geçen haftaya göre</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{totalOrders}</p><p className="text-xs text-gray-500">Toplam Sipariş</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">₺{avgOrderValue}</p><p className="text-xs text-gray-500">Ort. Sipariş</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{totalCustomers}</p><p className="text-xs text-gray-500">Müşteri</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
          <h3 className="font-bold mb-4">Günlük Ciro</h3>
          <div className="space-y-3">
            {last7Days.map(day => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-500">{new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-end px-2" style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}>
                    <span className="text-xs text-white font-medium">₺{day.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <span className="w-16 text-sm text-gray-500 text-right">{day.orders} sipariş</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-bold mb-4">Ödeme Yöntemleri</h3>
          <div className="space-y-4">
            {paymentBreakdown.map(payment => (
              <div key={payment.method}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{payment.method}</span>
                  <span className="text-sm font-medium">₺{payment.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${payment.percentage}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">%{payment.percentage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">En Çok Satan Ürünler</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Satış Adedi</th>
              <th className="px-4 py-3 font-medium">Toplam Gelir</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {topProducts.map((product, i) => (
              <tr key={product.name} className="hover:bg-gray-50">
                <td className="px-4 py-3"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span></td>
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.quantity} adet</td>
                <td className="px-4 py-3 font-bold text-orange-600">₺{product.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Summary */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold">Günlük Özet</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Ciro</th>
              <th className="px-4 py-3 font-medium">Sipariş</th>
              <th className="px-4 py-3 font-medium">Ort. Sipariş</th>
              <th className="px-4 py-3 font-medium">Müşteri</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {last7Days.map(day => (
              <tr key={day.date} className="hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' })}</td>
                <td className="px-4 py-3 font-bold text-orange-600">₺{day.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">{day.orders}</td>
                <td className="px-4 py-3">₺{day.avgOrder}</td>
                <td className="px-4 py-3">{day.customers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
