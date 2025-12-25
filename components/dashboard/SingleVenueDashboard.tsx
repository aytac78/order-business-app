'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore } from '@/stores';
import { useTranslation } from '@/lib/i18n';
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
  ArrowDownRight,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';

// Demo data for single venue
const demoStats = {
  todayRevenue: 45680,
  yesterdayRevenue: 42150,
  todayOrders: 127,
  yesterdayOrders: 118,
  activeOrders: 12,
  avgOrderValue: 360,
  totalCustomers: 89,
  newCustomers: 23,
  occupancyRate: 78,
  avgWaitTime: 14,
  pendingReservations: 8,
  staffOnDuty: 14
};

const recentOrders = [
  { id: 'ORD-127', table: '5', amount: 680, status: 'preparing', time: 2 },
  { id: 'ORD-126', table: '12', amount: 420, status: 'ready', time: 5 },
  { id: 'ORD-125', table: '3', amount: 890, status: 'served', time: 8 },
  { id: 'ORD-124', table: '8', amount: 1250, status: 'pending', time: 10 },
  { id: 'ORD-123', table: 'QR', amount: 340, status: 'confirmed', time: 12 },
];

const topProducts = [
  { name: 'Izgara Levrek', quantity: 34, revenue: 10200 },
  { name: 'Karides Güveç', quantity: 28, revenue: 7000 },
  { name: 'Karışık Meze', quantity: 45, revenue: 6750 },
  { name: 'Rakı (70cl)', quantity: 22, revenue: 6600 },
  { name: 'Ahtapot Izgara', quantity: 18, revenue: 5400 },
];

export function SingleVenueDashboard() {
  const router = useRouter();
  const { currentVenue } = useVenueStore();
  const { t, formatCurrency, formatDate, formatTime, locale } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const revenueChange = ((demoStats.todayRevenue - demoStats.yesterdayRevenue) / demoStats.yesterdayRevenue * 100).toFixed(1);
  const ordersChange = ((demoStats.todayOrders - demoStats.yesterdayOrders) / demoStats.yesterdayOrders * 100).toFixed(1);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-gray-100 text-gray-800',
  };

  // Loading state for hydration
  if (!mounted || !currentTime) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-100 rounded-2xl h-20" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentVenue?.name || t('nav.dashboard')}
          </h1>
          <p className="text-gray-500 mt-1">
            {currentTime.toLocaleDateString(locale, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {currentTime.toLocaleTimeString(locale)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">{t('common.open')}</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.todayRevenue')}
          value={formatCurrency(demoStats.todayRevenue)}
          change={parseFloat(revenueChange)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title={t('dashboard.orderCount')}
          value={demoStats.todayOrders.toString()}
          change={parseFloat(ordersChange)}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title={t('dashboard.activeOrders')}
          value={demoStats.activeOrders.toString()}
          subtitle={t('dashboard.processing')}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title={t('dashboard.avgOrderValue')}
          value={formatCurrency(demoStats.avgOrderValue)}
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          icon={Users}
          label={t('dashboard.totalCustomers')}
          value={demoStats.totalCustomers}
          subValue={`+${demoStats.newCustomers} ${t('dashboard.new')}`}
          t={t}
        />
        <QuickStatCard
          icon={Utensils}
          label={t('dashboard.occupancy')}
          value={`%${demoStats.occupancyRate}`}
          t={t}
        />
        <QuickStatCard
          icon={Clock}
          label={t('dashboard.avgWaitTime')}
          value={`${demoStats.avgWaitTime} ${t('common.minutes')}`}
          t={t}
        />
        <QuickStatCard
          icon={CalendarCheck}
          label={t('dashboard.pendingReservations')}
          value={demoStats.pendingReservations}
          subValue={t('dashboard.awaitingApproval')}
          t={t}
        />
      </div>

      {/* Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentOrders')}</h2>
            <button 
              onClick={() => router.push('/orders')}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              {t('common.viewAll')}
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {order.table === 'QR' ? 'QR' : `M${order.table}`}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {order.table === 'QR' ? 'QR' : `${t('tables.table')} ${order.table}`} • {order.time} {t('time.minutesAgo')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {t(`orders.status.${order.status}`)}
                  </span>
                  <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.topSelling')}</h2>
            <span className="text-xs text-gray-400">{t('dashboard.today')}</span>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantity} {t('common.pieces')}</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-900">{t('dashboard.stockAlertTitle', { count: 3 })}</p>
          <p className="text-sm text-amber-700">{t('dashboard.stockAlertDesc')}</p>
        </div>
        <button 
          onClick={() => router.push('/stock')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('dashboard.checkStock')}
        </button>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: any;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

function StatCard({ title, value, change, subtitle, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Quick Stat Card
interface QuickStatCardProps {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  t: (key: string) => string;
}

function QuickStatCard({ icon: Icon, label, value, subValue }: QuickStatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-bold text-gray-900">{value}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  );
}
