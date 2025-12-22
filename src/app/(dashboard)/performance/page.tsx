'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Award,
  Target,
  Clock,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  metrics: {
    orders: number;
    revenue: number;
    avgTicket: number;
    rating: number;
    speed: number; // minutes
    upsellRate: number;
  };
  trend: number;
  rank: number;
}

const demoPerformance: StaffPerformance[] = [
  { id: '1', name: 'Ahmet Yılmaz', role: 'Garson', metrics: { orders: 145, revenue: 52300, avgTicket: 360, rating: 4.9, speed: 12, upsellRate: 35 }, trend: 12, rank: 1 },
  { id: '2', name: 'Mehmet Demir', role: 'Garson', metrics: { orders: 132, revenue: 44500, avgTicket: 337, rating: 4.7, speed: 14, upsellRate: 28 }, trend: 8, rank: 2 },
  { id: '3', name: 'Ayşe Kaya', role: 'Garson', metrics: { orders: 128, revenue: 41200, avgTicket: 322, rating: 4.8, speed: 11, upsellRate: 32 }, trend: 5, rank: 3 },
  { id: '4', name: 'Fatma Şahin', role: 'Garson', metrics: { orders: 98, revenue: 32400, avgTicket: 330, rating: 4.5, speed: 15, upsellRate: 22 }, trend: -3, rank: 4 },
  { id: '5', name: 'Ali Öztürk', role: 'Garson', metrics: { orders: 87, revenue: 28900, avgTicket: 332, rating: 4.4, speed: 18, upsellRate: 18 }, trend: -8, rank: 5 },
];

export default function PerformancePage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'rating'>('revenue');

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedPerformance = [...demoPerformance].sort((a, b) => b.metrics[sortBy] - a.metrics[sortBy]);

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Performans analizi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performans</h1>
          <p className="text-gray-500 mt-1">Personel performansını analiz edin</p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                period === p ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {p === 'today' ? 'Bugün' : p === 'week' ? 'Hafta' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedPerformance.slice(0, 3).map((staff, i) => (
          <div key={staff.id} className={`rounded-2xl p-6 ${
            i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
            i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
            'bg-gradient-to-br from-orange-300 to-orange-400 text-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  i === 0 ? 'bg-white/20' : 'bg-black/10'
                }`}>
                  #{i + 1}
                </div>
                <div>
                  <p className="font-bold">{staff.name}</p>
                  <p className="text-sm opacity-80">{staff.role}</p>
                </div>
              </div>
              <Award className={`w-8 h-8 ${i === 0 ? 'text-yellow-200' : 'opacity-50'}`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-80">Ciro</p>
                <p className="text-xl font-bold">₺{staff.metrics.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Sipariş</p>
                <p className="text-xl font-bold">{staff.metrics.orders}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Ciro</p>
              <p className="text-xl font-bold text-gray-900">₺199,300</p>
              <p className="text-xs text-green-600">+12% geçen haftaya göre</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Toplam Sipariş</p>
              <p className="text-xl font-bold text-gray-900">590</p>
              <p className="text-xs text-green-600">+8% geçen haftaya göre</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ort. Puan</p>
              <p className="text-xl font-bold text-gray-900">4.66</p>
              <p className="text-xs text-green-600">+0.2 geçen aya göre</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ort. Hız</p>
              <p className="text-xl font-bold text-gray-900">14 dk</p>
              <p className="text-xs text-green-600">-2 dk iyileşme</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Detaylı Performans</h3>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="revenue">Ciroya Göre</option>
            <option value="orders">Siparişe Göre</option>
            <option value="rating">Puana Göre</option>
          </select>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">SIRA</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">PERSONEL</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">SİPARİŞ</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">CİRO</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">ORT. HESAP</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">PUAN</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">HIZ</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">TREND</th>
            </tr>
          </thead>
          <tbody>
            {sortedPerformance.map((staff, i) => (
              <tr key={staff.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-200 text-gray-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-500">{staff.role}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-medium">{staff.metrics.orders}</td>
                <td className="py-4 px-4 text-right font-medium">₺{staff.metrics.revenue.toLocaleString()}</td>
                <td className="py-4 px-4 text-right">₺{staff.metrics.avgTicket}</td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{staff.metrics.rating}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">{staff.metrics.speed} dk</td>
                <td className="py-4 px-4 text-right">
                  <div className={`flex items-center justify-end gap-1 ${
                    staff.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {staff.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{Math.abs(staff.trend)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
