'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore } from '@/stores';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  CalendarCheck,
  Clock,
  Utensils,
  ChefHat,
  CreditCard,
  ArrowUpRight,
  MoreHorizontal,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  activeOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  occupancyRate: number;
  avgWaitTime: number;
  pendingReservations: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  table_number: string | null;
  total: number;
  status: string;
  created_at: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export function SingleVenueDashboard() {
  const router = useRouter();
  const { currentVenue } = useVenueStore();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    yesterdayRevenue: 0,
    todayOrders: 0,
    yesterdayOrders: 0,
    activeOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    newCustomers: 0,
    occupancyRate: 0,
    avgWaitTime: 0,
    pendingReservations: 0
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentVenue) {
      fetchDashboardData();
    }
  }, [currentVenue]);

  const fetchDashboardData = async () => {
    if (!currentVenue) return;
    
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Bugünkü siparişler
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .gte('created_at', today.toISOString());

      // Dünkü siparişler
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      // Aktif siparişler
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready']);

      // Son siparişler
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Bekleyen rezervasyonlar
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .eq('status', 'pending');

      // Müşteri sayısı
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', currentVenue.id);

      // İstatistikleri hesapla
      const todayRevenueTotal = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const yesterdayRevenueTotal = yesterdayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const todayOrderCount = todayOrders?.length || 0;
      const yesterdayOrderCount = yesterdayOrders?.length || 0;

      setStats({
        todayRevenue: todayRevenueTotal,
        yesterdayRevenue: yesterdayRevenueTotal,
        todayOrders: todayOrderCount,
        yesterdayOrders: yesterdayOrderCount,
        activeOrders: activeOrders?.length || 0,
        avgOrderValue: todayOrderCount > 0 ? todayRevenueTotal / todayOrderCount : 0,
        totalCustomers: customerCount || 0,
        newCustomers: 0,
        occupancyRate: 0,
        avgWaitTime: 0,
        pendingReservations: reservations?.length || 0
      });

      setRecentOrders(recent || []);

      // Top ürünleri hesapla (items JSON'dan)
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      todayOrders?.forEach(order => {
        const items = order.items || [];
        items.forEach((item: any) => {
          const existing = productMap.get(item.name || item.product_name) || { quantity: 0, revenue: 0 };
          productMap.set(item.name || item.product_name, {
            quantity: existing.quantity + (item.quantity || 1),
            revenue: existing.revenue + ((item.price || item.unit_price || 0) * (item.quantity || 1))
          });
        });
      });

      const topProductsList = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProductsList);

    } catch (error) {
      console.error('Dashboard veri yükleme hatası:', error);
    }
    
    setLoading(false);
  };

  const revenueChange = stats.yesterdayRevenue > 0 
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100).toFixed(1)
    : '0';
  const ordersChange = stats.yesterdayOrders > 0
    ? ((stats.todayOrders - stats.yesterdayOrders) / stats.yesterdayOrders * 100).toFixed(1)
    : '0';

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900/50 text-yellow-300',
    confirmed: 'bg-blue-900/50 text-blue-300',
    preparing: 'bg-purple-900/50 text-purple-300',
    ready: 'bg-green-900/50 text-green-300',
    served: 'bg-gray-700 text-gray-300',
    completed: 'bg-gray-700 text-gray-300',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    preparing: 'Hazırlanıyor',
    ready: 'Hazır',
    served: 'Servis Edildi',
    completed: 'Tamamlandı',
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-800 rounded-2xl h-96" />;
  }

  return (
    <div className="space-y-6 bg-gray-900 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {currentVenue?.name || 'Dashboard'}
          </h1>
          <p className="text-gray-400">
            {currentTime && (
              <>
                {currentTime.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  weekday: 'long'
                })} • {currentTime.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US')}
              </>
            )}
          </p>
        </div>
        <button type="button"
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Yükleniyor...' : 'Yenile'}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-green-400" />}
          iconBg="bg-green-900/50"
          label={t('todayRevenue')}
          value={formatCurrency(stats.todayRevenue)}
          change={`${parseFloat(revenueChange) >= 0 ? '↗' : '↘'} ${revenueChange}%`}
          changeColor={parseFloat(revenueChange) >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          icon={<ShoppingBag className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-900/50"
          label={t('orderCount')}
          value={stats.todayOrders.toString()}
          change={`${parseFloat(ordersChange) >= 0 ? '↗' : '↘'} ${ordersChange}%`}
          changeColor={parseFloat(ordersChange) >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-orange-400" />}
          iconBg="bg-orange-900/50"
          label={t('activeOrders')}
          value={stats.activeOrders.toString()}
          subValue={t('processing')}
        />
        <StatCard
          icon={<CreditCard className="w-6 h-6 text-purple-400" />}
          iconBg="bg-purple-900/50"
          label={t('avgOrderValue')}
          value={formatCurrency(stats.avgOrderValue)}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label={t('totalCustomers')}
          value={stats.totalCustomers.toString()}
        />
        <MiniStatCard
          icon={<Utensils className="w-5 h-5 text-green-400" />}
          label={t('occupancy')}
          value={`%${stats.occupancyRate}`}
        />
        <MiniStatCard
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
          label={t('avgWaitTime')}
          value={`${stats.avgWaitTime} dk`}
        />
        <MiniStatCard
          icon={<CalendarCheck className="w-5 h-5 text-purple-400" />}
          label={t('pendingReservations')}
          value={stats.pendingReservations.toString()}
        />
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{t('recentOrders')}</h2>
            <button type="button" 
              onClick={() => router.push('/orders')}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              {tCommon('viewAll')}
            </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Henüz sipariş yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                      {order.table_number ? `M${order.table_number}` : 'QR'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-400">
                        {order.table_number ? `Masa ${order.table_number}` : 'QR Sipariş'} • {getTimeAgo(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[order.status] || 'bg-gray-600 text-gray-300'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <span className="font-semibold text-white">{formatCurrency(order.total || 0)}</span>
                    <button type="button" className="p-1 hover:bg-gray-600 rounded text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{t('topSelling')}</h2>
            <span className="text-sm text-gray-400">{t('today')}</span>
          </div>
          
          {topProducts.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Bugün henüz satış yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.quantity} {tCommon('pieces')}</p>
                  </div>
                  <p className="font-semibold text-green-400">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  iconBg, 
  label, 
  value, 
  change, 
  changeColor,
  subValue 
}: { 
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change?: string;
  changeColor?: string;
  subValue?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColor}`}>{change}</span>
        )}
      </div>
      <p className="text-gray-400 text-sm mt-4">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
}

function MiniStatCard({ 
  icon, 
  label, 
  value,
  subValue 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
          {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}