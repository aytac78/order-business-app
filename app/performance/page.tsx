'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { TrendingUp, Star, Users, Clock, Award, Target, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  metrics: {
    ordersHandled: number;
    revenue: number;
    avgServiceTime: number;
    customerRating: number;
    tips: number;
    hoursWorked: number;
  };
  trend: 'up' | 'down' | 'stable';
}

const demoPerformance: StaffPerformance[] = [
  { id: '1', name: 'Ahmet Yılmaz', role: 'Garson', metrics: { ordersHandled: 156, revenue: 28500, avgServiceTime: 12, customerRating: 4.8, tips: 1250, hoursWorked: 45 }, trend: 'up' },
  { id: '2', name: 'Mehmet Demir', role: 'Garson', metrics: { ordersHandled: 142, revenue: 24800, avgServiceTime: 15, customerRating: 4.6, tips: 980, hoursWorked: 42 }, trend: 'stable' },
  { id: '3', name: 'Ayşe Kaya', role: 'Kasiyer', metrics: { ordersHandled: 320, revenue: 85600, avgServiceTime: 3, customerRating: 4.9, tips: 450, hoursWorked: 48 }, trend: 'up' },
  { id: '4', name: 'Fatma Şen', role: 'Garson', metrics: { ordersHandled: 98, revenue: 18200, avgServiceTime: 18, customerRating: 4.3, tips: 720, hoursWorked: 38 }, trend: 'down' },
  { id: '5', name: 'Ali Öztürk', role: 'Mutfak', metrics: { ordersHandled: 245, revenue: 0, avgServiceTime: 22, customerRating: 4.7, tips: 0, hoursWorked: 50 }, trend: 'up' },
  { id: '6', name: 'Zeynep Arslan', role: 'Resepsiyon', metrics: { ordersHandled: 0, revenue: 0, avgServiceTime: 0, customerRating: 4.9, tips: 380, hoursWorked: 44 }, trend: 'stable' },
];

export default function PerformancePage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'rating'>('revenue');

  useEffect(() => { setMounted(true); }, []);

  const sortedPerformance = [...demoPerformance].sort((a, b) => {
    if (sortBy === 'revenue') return b.metrics.revenue - a.metrics.revenue;
    if (sortBy === 'orders') return b.metrics.ordersHandled - a.metrics.ordersHandled;
    return b.metrics.customerRating - a.metrics.customerRating;
  });

  const topPerformer = sortedPerformance[0];
  const totalRevenue = demoPerformance.reduce((sum, s) => sum + s.metrics.revenue, 0);
  const totalOrders = demoPerformance.reduce((sum, s) => sum + s.metrics.ordersHandled, 0);
  const avgRating = (demoPerformance.reduce((sum, s) => sum + s.metrics.customerRating, 0) / demoPerformance.length).toFixed(1);

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Performans analizi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personel Performansı</h1>
          <p className="text-gray-500">{currentVenue?.name}</p>
        </div>
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {['day', 'week', 'month'].map(range => (
            <button key={range} onClick={() => setDateRange(range)} className={`px-4 py-2 rounded-lg font-medium text-sm ${dateRange === range ? 'bg-white shadow' : ''}`}>
              {range === 'day' ? 'Bugün' : range === 'week' ? 'Hafta' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Performer */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-amber-100 text-sm">Bu Haftanın Yıldızı</p>
            <h2 className="text-2xl font-bold">{topPerformer.name}</h2>
            <p className="text-amber-100">{topPerformer.role}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">₺{topPerformer.metrics.revenue.toLocaleString()}</p>
            <p className="text-amber-100">{topPerformer.metrics.ordersHandled} sipariş</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">₺{(totalRevenue / 1000).toFixed(0)}k</p><p className="text-xs text-gray-500">Toplam Ciro</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Target className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{totalOrders}</p><p className="text-xs text-gray-500">Toplam Sipariş</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Star className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{avgRating} ⭐</p><p className="text-xs text-gray-500">Ort. Puan</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{demoPerformance.length}</p><p className="text-xs text-gray-500">Aktif Personel</p></div>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="bg-white rounded-xl p-4 border flex items-center gap-4">
        <span className="text-sm text-gray-500">Sırala:</span>
        <div className="flex gap-2">
          {[
            { key: 'revenue', label: 'Ciro' },
            { key: 'orders', label: 'Sipariş' },
            { key: 'rating', label: 'Puan' },
          ].map(option => (
            <button key={option.key} onClick={() => setSortBy(option.key as any)} className={`px-4 py-2 rounded-lg font-medium text-sm ${sortBy === option.key ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Personel</th>
                <th className="px-4 py-3 font-medium">Sipariş</th>
                <th className="px-4 py-3 font-medium">Ciro</th>
                <th className="px-4 py-3 font-medium">Ort. Süre</th>
                <th className="px-4 py-3 font-medium">Puan</th>
                <th className="px-4 py-3 font-medium">Bahşiş</th>
                <th className="px-4 py-3 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedPerformance.map((staff, index) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {index < 3 ? (
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-gray-400">{index + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{staff.metrics.ordersHandled}</td>
                  <td className="px-4 py-3 font-bold text-green-600">₺{staff.metrics.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">{staff.metrics.avgServiceTime > 0 ? `${staff.metrics.avgServiceTime} dk` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {staff.metrics.customerRating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-purple-600">₺{staff.metrics.tips}</td>
                  <td className="px-4 py-3">
                    {staff.trend === 'up' && <ArrowUp className="w-5 h-5 text-green-500" />}
                    {staff.trend === 'down' && <ArrowDown className="w-5 h-5 text-red-500" />}
                    {staff.trend === 'stable' && <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
