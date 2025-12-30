'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, Users, ShoppingBag, Clock, AlertCircle,
  Loader2, RefreshCw, ChefHat, Calendar, DollarSign,
  ArrowUpRight, ArrowDownRight, Utensils, Package
} from 'lucide-react';

interface DashboardStats {
  todayRevenue: number;
  orderCount: number;
  activeOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  occupancyRate: number;
  pendingReservations: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  table_number?: string;
  total: number;
  status: string;
  type: string;
  created_at: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export default function DashboardPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('dashboard');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Status config
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: tOrders('pending'), color: 'bg-amber-500' },
    confirmed: { label: tOrders('confirmed'), color: 'bg-blue-500' },
    preparing: { label: tOrders('preparing'), color: 'bg-purple-500' },
    ready: { label: tOrders('ready'), color: 'bg-green-500' },
    served: { label: tOrders('served'), color: 'bg-teal-500' },
    completed: { label: tOrders('completed'), color: 'bg-gray-500' },
  };

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    const today = new Date().toISOString().split('T')[0];

    // Fetch orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });

    // Fetch tables
    const { data: tablesData } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true);

    // Fetch reservations
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('date', today)
      .in('status', ['pending', 'confirmed']);

    const orders = ordersData || [];
    const tables = tablesData || [];
    const reservations = reservationsData || [];

    // Calculate stats
    const completedOrders = orders.filter(o => ['completed', 'served'].includes(o.status));
    const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
    const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;

    setStats({
      todayRevenue,
      orderCount: orders.length,
      activeOrders: activeOrders.length,
      avgOrderValue: orders.length > 0 ? todayRevenue / Math.max(completedOrders.length, 1) : 0,
      totalCustomers: completedOrders.length,
      occupancyRate: tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0,
      pendingReservations: reservations.length,
    });

    setRecentOrders(orders.slice(0, 5));

    // Calculate top products
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const name = item.name || item.product_name || 'Unknown';
        const existing = productMap.get(name) || { quantity: 0, revenue: 0 };
        productMap.set(name, {
          quantity: existing.quantity + (item.quantity || 1),
          revenue: existing.revenue + ((item.price || item.unit_price || 0) * (item.quantity || 1))
        });
      });
    });

    const topProductsArray = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    setTopProducts(topProductsArray);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} ${t('minutes')}`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {tCommon('refresh')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today Revenue */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="flex items-center text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              12%
            </span>
          </div>
          <p className="text-2xl font-bold text-white">₺{stats?.todayRevenue.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-400">{t('todayRevenue')}</p>
        </div>

        {/* Order Count */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-8 h-8 text-blue-400" />
            <span className="text-blue-400 text-sm">{t('completed')}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.orderCount || 0}</p>
          <p className="text-sm text-gray-400">{t('orderCount')}</p>
        </div>

        {/* Active Orders */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ChefHat className="w-8 h-8 text-purple-400" />
            <span className="text-purple-400 text-sm">{t('preparing')}</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats?.activeOrders || 0}</p>
          <p className="text-sm text-gray-400">{t('activeOrders')}</p>
        </div>

        {/* Avg Order Value */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white">₺{stats?.avgOrderValue.toFixed(0) || 0}</p>
          <p className="text-sm text-gray-400">{t('avgOrderValue')}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-cyan-400 bg-cyan-400/20 rounded-xl p-2" />
            <div>
              <p className="text-xl font-bold text-white">{stats?.totalCustomers || 0}</p>
              <p className="text-sm text-gray-400">{t('totalCustomers')}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Utensils className="w-10 h-10 text-amber-400 bg-amber-400/20 rounded-xl p-2" />
            <div>
              <p className="text-xl font-bold text-white">%{stats?.occupancyRate || 0}</p>
              <p className="text-sm text-gray-400">{t('occupancyRate')}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="w-10 h-10 text-pink-400 bg-pink-400/20 rounded-xl p-2" />
            <div>
              <p className="text-xl font-bold text-white">{stats?.pendingReservations || 0}</p>
              <p className="text-sm text-gray-400">{t('pendingReservations')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">{t('recentOrders')}</h2>
            <a href="/orders" className="text-sm text-orange-400 hover:text-orange-300">{t('viewAll')}</a>
          </div>
          <div className="divide-y divide-gray-700">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('noOrders')}</p>
              </div>
            ) : (
              recentOrders.map(order => {
                const status = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          {order.table_number ? (
                            <span className="font-bold text-orange-400">#{order.table_number}</span>
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {order.table_number ? `${t('table')} ${order.table_number}` : order.order_number}
                          </p>
                          <p className="text-xs text-gray-400">{getTimeAgo(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">₺{order.total?.toFixed(0) || 0}</p>
                        <span className={`text-xs px-2 py-0.5 ${status.color} text-white rounded-full`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">{t('topSellingProducts')}</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('noProducts')}</p>
              </div>
            ) : (
              topProducts.map((product, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.quantity} {tCommon('items')}</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-400">₺{product.revenue.toFixed(0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
