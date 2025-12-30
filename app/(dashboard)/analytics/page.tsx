'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users,
  AlertCircle, Loader2, RefreshCw, Calendar, BarChart3, PieChart
} from 'lucide-react';

interface AnalyticsData {
  revenue: { today: number; yesterday: number; week: number; month: number };
  orders: { today: number; yesterday: number; week: number; month: number };
  avgOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  ordersByType: { type: string; count: number }[];
  hourlyRevenue: { hour: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');
  const tOrders = useTranslations('orders');

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [data, setData] = useState<AnalyticsData>({
    revenue: { today: 0, yesterday: 0, week: 0, month: 0 },
    orders: { today: 0, yesterday: 0, week: 0, month: 0 },
    avgOrderValue: 0,
    topProducts: [],
    ordersByType: [],
    hourlyRevenue: []
  });

  const loadAnalytics = useCallback(async () => {
    if (!currentVenue?.id) return;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const yesterday = new Date(Date.now() - 86400000);
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    // Get orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .gte('created_at', monthAgo);

    if (orders) {
      const todayOrders = orders.filter(o => o.created_at >= startOfDay);
      const yesterdayOrders = orders.filter(o => o.created_at >= startOfYesterday && o.created_at < startOfDay);
      const weekOrders = orders.filter(o => o.created_at >= weekAgo);
      const completedOrders = orders.filter(o => o.status === 'completed');

      // Revenue calculations
      const todayRevenue = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
      const yesterdayRevenue = yesterdayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
      const weekRevenue = weekOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
      const monthRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Orders by type
      const typeCount = orders.reduce((acc, o) => {
        acc[o.type] = (acc[o.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ordersByType = Object.entries(typeCount).map(([type, count]) => ({ type, count }));

      // Hourly revenue (for today)
      const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => {
        const hourOrders = todayOrders.filter(o => {
          const h = new Date(o.created_at).getHours();
          return h === hour && o.status === 'completed';
        });
        return { hour, revenue: hourOrders.reduce((sum, o) => sum + (o.total || 0), 0) };
      });

      // Top products
      const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
      orders.forEach(order => {
        const items = order.items || [];
        items.forEach((item: any) => {
          if (!productCounts[item.product_id]) {
            productCounts[item.product_id] = { name: item.product_name, quantity: 0, revenue: 0 };
          }
          productCounts[item.product_id].quantity += item.quantity;
          productCounts[item.product_id].revenue += item.total_price || 0;
        });
      });
      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setData({
        revenue: { today: todayRevenue, yesterday: yesterdayRevenue, week: weekRevenue, month: monthRevenue },
        orders: { today: todayOrders.length, yesterday: yesterdayOrders.length, week: weekOrders.length, month: orders.length },
        avgOrderValue: completedOrders.length > 0 ? monthRevenue / completedOrders.length : 0,
        topProducts,
        ordersByType,
        hourlyRevenue
      });
    }

    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getPercentChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const orderTypeLabels: Record<string, string> = {
    dine_in: tOrders('dineIn'),
    takeaway: tOrders('takeaway'),
    delivery: tOrders('delivery'),
    qr_order: tOrders('qrOrder')
  };

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

  const revenueChange = parseFloat(getPercentChange(data.revenue.today, data.revenue.yesterday));
  const ordersChange = parseFloat(getPercentChange(data.orders.today, data.orders.yesterday));

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
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 bg-white/20 rounded-xl p-2" />
            <span className={`flex items-center gap-1 text-sm ${revenueChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              %{Math.abs(revenueChange)}
            </span>
          </div>
          <p className="text-green-100 text-sm">{t('revenue')}</p>
          <p className="text-3xl font-bold">₺{data.revenue[dateRange].toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-10 h-10 bg-white/20 rounded-xl p-2" />
            <span className={`flex items-center gap-1 text-sm ${ordersChange >= 0 ? 'text-blue-200' : 'text-red-200'}`}>
              {ordersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              %{Math.abs(ordersChange)}
            </span>
          </div>
          <p className="text-blue-100 text-sm">{t('orders')}</p>
          <p className="text-3xl font-bold">{data.orders[dateRange]}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-10 h-10 bg-white/20 rounded-xl p-2" />
          </div>
          <p className="text-purple-100 text-sm">Ort. Sipariş</p>
          <p className="text-3xl font-bold">₺{data.avgOrderValue.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 bg-white/20 rounded-xl p-2" />
          </div>
          <p className="text-orange-100 text-sm">{t('customers')}</p>
          <p className="text-3xl font-bold">{data.orders.month}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            En Çok Satan Ürünler
          </h2>
          {data.topProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Veri yok</p>
          ) : (
            <div className="space-y-4">
              {data.topProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.quantity} adet</p>
                  </div>
                  <span className="text-green-400 font-medium">₺{product.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by Type */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-orange-500" />
            Sipariş Türleri
          </h2>
          {data.ordersByType.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Veri yok</p>
          ) : (
            <div className="space-y-4">
              {data.ordersByType.map((item, index) => {
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];
                const total = data.ordersByType.reduce((sum, i) => sum + i.count, 0);
                const percent = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">{orderTypeLabels[item.type] || item.type}</span>
                      <span className="text-gray-400">{item.count} (%{percent})</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[index % colors.length]} rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hourly Revenue Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          Saatlik Gelir (Bugün)
        </h2>
        <div className="flex items-end gap-1 h-48">
          {data.hourlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...data.hourlyRevenue.map(h => h.revenue), 1);
            const height = (item.revenue / maxRevenue * 100) || 2;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-orange-500 rounded-t transition-all hover:bg-orange-400"
                  style={{ height: `${height}%` }}
                  title={`${item.hour}:00 - ₺${item.revenue}`}
                />
                {index % 4 === 0 && (
                  <span className="text-xs text-gray-500 mt-1">{item.hour}:00</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
