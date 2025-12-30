'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslation } from '@/lib/i18n';
import { T } from '@/components/T';
import { VenueSummary } from '@/types';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  Building2,
  MoreVertical,
  Eye,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Demo data
const demoVenueSummaries: VenueSummary[] = [
  {
    venue_id: '1',
    venue_name: 'ORDER Bodrum Marina',
    today_revenue: 45680,
    today_orders: 127,
    active_orders: 12,
    pending_reservations: 8,
    low_stock_items: 3,
    staff_on_duty: 14,
    occupancy_rate: 78
  },
  {
    venue_id: '2',
    venue_name: 'ORDER Yalıkavak',
    today_revenue: 38420,
    today_orders: 98,
    active_orders: 8,
    pending_reservations: 5,
    low_stock_items: 1,
    staff_on_duty: 11,
    occupancy_rate: 65
  },
  {
    venue_id: '3',
    venue_name: 'ORDER Türkbükü',
    today_revenue: 52340,
    today_orders: 145,
    active_orders: 15,
    pending_reservations: 12,
    low_stock_items: 5,
    staff_on_duty: 16,
    occupancy_rate: 92
  }
];

export function MultiVenueDashboard() {
  const { venueSummaries, setVenueSummaries, venues } = useVenueStore();
  const { formatCurrency, locale } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastUpdated(new Date());
    setVenueSummaries([]);
  }, [setVenueSummaries]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const totals = venueSummaries.reduce(
    (acc, venue) => ({
      revenue: acc.revenue + venue.today_revenue,
      orders: acc.orders + venue.today_orders,
      activeOrders: acc.activeOrders + venue.active_orders,
      reservations: acc.reservations + venue.pending_reservations,
      lowStock: acc.lowStock + venue.low_stock_items,
      staff: acc.staff + venue.staff_on_duty
    }),
    { revenue: 0, orders: 0, activeOrders: 0, reservations: 0, lowStock: 0, staff: 0 }
  );

  const avgOccupancy = venueSummaries.length > 0
    ? Math.round(venueSummaries.reduce((acc, v) => acc + v.occupancy_rate, 0) / venueSummaries.length)
    : 0;

  if (!mounted) {
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
            <T>Merkezi Dashboard</T>
          </h1>
          <p className="text-gray-500 mt-1">
            <T>Tüm mekanlarınızın anlık durumu</T> • {venueSummaries.length} <T>mekan</T>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            <T>Son güncelleme</T>: {lastUpdated?.toLocaleTimeString(locale) || '--:--'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium"><T>Yenile</T></span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title={<T>Toplam Ciro</T>}
          value={formatCurrency(totals.revenue)}
          change={12.5}
          icon={DollarSign}
          color="green"
        />
        <SummaryCard
          title={<T>Toplam Sipariş</T>}
          value={totals.orders.toString()}
          change={8.2}
          icon={ShoppingBag}
          color="blue"
        />
        <SummaryCard
          title={<T>Aktif Siparişler</T>}
          value={totals.activeOrders.toString()}
          subtitle={<T>Şu anda işleniyor</T>}
          icon={TrendingUp}
          color="orange"
        />
        <SummaryCard
          title={<T>Bekleyen Rezervasyon</T>}
          value={totals.reservations.toString()}
          subtitle={<T>Onay bekliyor</T>}
          icon={CalendarCheck}
          color="purple"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm"><T>Ortalama Doluluk</T></p>
              <p className="text-4xl font-bold mt-2">%{avgOccupancy}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm"><T>Düşük Stok Uyarısı</T></p>
              <p className="text-4xl font-bold mt-2">{totals.lowStock}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm"><T>Toplam Personel</T></p>
              <p className="text-4xl font-bold mt-2">{totals.staff}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Venue Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4"><T>Mekan Detayları</T></h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {venueSummaries.map((venue) => (
            <VenueCard key={venue.venue_id} venue={venue} />
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4"><T>Son Uyarılar</T></h2>
        <div className="space-y-3">
          <AlertItem
            venue="ORDER Türkbükü"
            message={<T>5 ürün kritik stok seviyesinde</T>}
            type="warning"
            time={<><T>5 dk önce</T></>}
          />
          <AlertItem
            venue="ORDER Bodrum Marina"
            message={<T>Yeni VIP rezervasyon: 8 kişi, 20:00</T>}
            type="info"
            time={<><T>12 dk önce</T></>}
          />
          <AlertItem
            venue="ORDER Yalıkavak"
            message={<T>Yoğun talep - ekstra personel önerilir</T>}
            type="info"
            time={<><T>25 dk önce</T></>}
          />
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: React.ReactNode;
  value: string;
  change?: number;
  subtitle?: React.ReactNode;
  icon: any;
  color: 'green' | 'blue' | 'orange' | 'purple';
}

function SummaryCard({ title, value, change, subtitle, icon: Icon, color }: SummaryCardProps) {
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

// Venue Card Component
function VenueCard({ venue }: { venue: VenueSummary }) {
  const [showMenu, setShowMenu] = useState(false);
  const { venues, setCurrentVenue } = useVenueStore();
  const { formatCurrency } = useTranslation();

  const handleGoToVenue = () => {
    const targetVenue = venues.find(v => v.id === venue.venue_id);
    if (targetVenue) {
      setCurrentVenue(targetVenue);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{venue.venue_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500"><T>Açık</T></span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
              <button 
                onClick={handleGoToVenue}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                <T>Detaya Git</T>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4" />
                <T>Ayarlar</T>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500"><T>Bugünkü Ciro</T></p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {formatCurrency(venue.today_revenue)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500"><T>Sipariş Sayısı</T></p>
          <p className="text-lg font-bold text-gray-900 mt-1">{venue.today_orders}</p>
        </div>
      </div>

      {/* Progress Bar - Occupancy */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500"><T>Doluluk Oranı</T></span>
          <span className="font-medium text-gray-900">%{venue.occupancy_rate}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              venue.occupancy_rate > 80
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : venue.occupancy_rate > 50
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${venue.occupancy_rate}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-gray-600">{venue.active_orders} <T>aktif</T></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600">{venue.pending_reservations} <T>rez.</T></span>
          </div>
        </div>
        {venue.low_stock_items > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{venue.low_stock_items} <T>stok uyarısı</T></span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button 
        onClick={handleGoToVenue}
        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors group"
      >
        <span><T>Mekana Git</T></span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

// Alert Item Component
interface AlertItemProps {
  venue: string;
  message: React.ReactNode;
  type: 'info' | 'warning' | 'error';
  time: React.ReactNode;
}

function AlertItem({ venue, message, type, time }: AlertItemProps) {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200'
  };

  const dotClasses = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${typeClasses[type]}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 ${dotClasses[type]}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{venue}</p>
        <p className="text-sm text-gray-600 mt-0.5">{message}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}
