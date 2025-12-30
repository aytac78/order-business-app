'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, AlertCircle, Loader2, RefreshCw, Users,
  ShoppingCart, Clock, Star, DollarSign, Award, Target
} from 'lucide-react';

interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  role: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  avg_service_time: number;
  tips_received: number;
  rating: number;
}

export default function PerformancePage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('performance');
  const tStaff = useTranslations('staff');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [performances, setPerformances] = useState<StaffPerformance[]>([]);

  const roleLabels: Record<string, string> = {
    owner: tStaff('owner'),
    manager: tStaff('manager'),
    cashier: tStaff('cashier'),
    waiter: tStaff('waiterRole'),
    kitchen: tStaff('kitchenRole'),
    reception: tStaff('receptionRole')
  };

  const loadPerformance = useCallback(async () => {
    if (!currentVenue?.id) return;

    let startDate: string;
    const now = new Date();
    
    if (dateRange === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    } else if (dateRange === 'week') {
      startDate = new Date(Date.now() - 7 * 86400000).toISOString();
    } else {
      startDate = new Date(Date.now() - 30 * 86400000).toISOString();
    }

    // Get staff
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true);

    // Get orders with waiter info
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .gte('created_at', startDate);

    if (staffData && orders) {
      const performanceMap: Record<string, StaffPerformance> = {};

      staffData.forEach(staff => {
        performanceMap[staff.id] = {
          staff_id: staff.id,
          staff_name: staff.name,
          role: staff.role,
          total_orders: 0,
          total_revenue: 0,
          avg_order_value: 0,
          avg_service_time: 0,
          tips_received: 0,
          rating: 4.5 + Math.random() * 0.5 // Simulated rating
        };
      });

      orders.forEach(order => {
        if (order.waiter_id && performanceMap[order.waiter_id]) {
          performanceMap[order.waiter_id].total_orders++;
          if (order.status === 'completed') {
            performanceMap[order.waiter_id].total_revenue += order.total || 0;
          }
        }
      });

      // Calculate averages
      Object.values(performanceMap).forEach(perf => {
        if (perf.total_orders > 0) {
          perf.avg_order_value = perf.total_revenue / perf.total_orders;
          perf.avg_service_time = 15 + Math.random() * 10; // Simulated
          perf.tips_received = perf.total_revenue * (0.05 + Math.random() * 0.05); // Simulated
        }
      });

      const sortedPerformances = Object.values(performanceMap)
        .sort((a, b) => b.total_revenue - a.total_revenue);

      setPerformances(sortedPerformances);
    }

    setLoading(false);
  }, [currentVenue?.id, dateRange]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  // Overall stats
  const totalRevenue = performances.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalOrders = performances.reduce((sum, p) => sum + p.total_orders, 0);
  const avgRating = performances.length > 0 
    ? performances.reduce((sum, p) => sum + p.rating, 0) / performances.length 
    : 0;
  const topPerformer = performances[0];

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-xl p-1">
            {(['today', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  dateRange === range ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === 'today' ? tCommon('today') : range === 'week' ? 'Hafta' : 'Ay'}
              </button>
            ))}
          </div>
          <button
            onClick={loadPerformance}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-green-400 bg-green-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-400">Toplam Gelir</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-blue-400 bg-blue-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-sm text-blue-400">{t('ordersHandled')}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Star className="w-10 h-10 text-amber-400 bg-amber-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{avgRating.toFixed(1)}</p>
              <p className="text-sm text-amber-400">{t('customerRating')}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Award className="w-10 h-10 text-purple-400 bg-purple-400/20 rounded-xl p-2" />
            <div>
              <p className="text-lg font-bold text-white truncate">{topPerformer?.staff_name || '-'}</p>
              <p className="text-sm text-purple-400">En İyi Performans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{t('staffPerformance')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">#</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Personel</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Rol</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">Sipariş</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">Gelir</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400">Ort. Sipariş</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">Servis</th>
                <th className="text-center py-4 px-6 text-sm font-medium text-gray-400">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    Performans verisi bulunamadı
                  </td>
                </tr>
              ) : (
                performances.map((perf, index) => (
                  <tr key={perf.staff_id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-700 text-white' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold">{perf.staff_name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-white">{perf.staff_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{roleLabels[perf.role] || perf.role}</td>
                    <td className="py-4 px-6 text-center text-white">{perf.total_orders}</td>
                    <td className="py-4 px-6 text-right font-medium text-green-400">₺{perf.total_revenue.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-gray-400">₺{perf.avg_order_value.toFixed(0)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="flex items-center justify-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        {perf.avg_service_time.toFixed(0)} dk
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-400">
                        <Star className="w-4 h-4 fill-current" />
                        {perf.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips Leaderboard */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          {t('tipsReceived')}
        </h2>
        <div className="space-y-4">
          {performances
            .filter(p => p.tips_received > 0)
            .sort((a, b) => b.tips_received - a.tips_received)
            .slice(0, 5)
            .map((perf, index) => (
              <div key={perf.staff_id} className="flex items-center gap-4">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-amber-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-700 text-white' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-white font-medium">{perf.staff_name}</p>
                </div>
                <span className="text-green-400 font-medium">₺{perf.tips_received.toFixed(0)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
