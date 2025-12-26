'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Calendar, TrendingUp, DollarSign, ShoppingBag, Users,
  RefreshCw, Download, ChevronDown, Building2
} from 'lucide-react';

type DateRange = 'today' | 'week' | 'month' | 'year';

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  ordersByType: { name: string; value: number }[];
  ordersByStatus: { name: string; value: number }[];
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308'];

export default function ReportsPage() {
  const { currentVenue, venues } = useVenueStore();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAllVenues = currentVenue === null;

  useEffect(() => {
    fetchReportData();
  }, [currentVenue?.id, dateRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return monthAgo.toISOString().split('T')[0];
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        return yearAgo.toISOString().split('T')[0];
      default:
        return now.toISOString().split('T')[0];
    }
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    const startDate = getDateFilter();

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate);

      if (!isAllVenues && currentVenue?.id) {
        query = query.eq('venue_id', currentVenue.id);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      const allOrders = orders || [];
      const completedOrders = allOrders.filter(o => o.status === 'completed');
      const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');

      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);
      const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Günlük ciro hesapla
      const dailyMap: Record<string, { revenue: number; orders: number }> = {};
      allOrders.forEach(order => {
        const date = order.created_at?.split('T')[0];
        if (date) {
          if (!dailyMap[date]) dailyMap[date] = { revenue: 0, orders: 0 };
          dailyMap[date].orders++;
          if (order.status === 'completed') {
            dailyMap[date].revenue += (order.total_amount || order.total || 0);
          }
        }
      });

      const dailyRevenue = Object.entries(dailyMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // En çok satan ürünler
      const productMap: Record<string, { quantity: number; revenue: number }> = {};
      completedOrders.forEach(order => {
        (order.items || []).forEach((item: any) => {
          const name = item.name || item.product_name || 'Bilinmeyen';
          if (!productMap[name]) productMap[name] = { quantity: 0, revenue: 0 };
          productMap[name].quantity += (item.quantity || 1);
          productMap[name].revenue += (item.quantity || 1) * (item.price || item.unit_price || 0);
        });
      });

      const topProducts = Object.entries(productMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Sipariş türleri
      const typeMap: Record<string, number> = {};
      allOrders.forEach(order => {
        const type = order.type || 'dine_in';
        typeMap[type] = (typeMap[type] || 0) + 1;
      });

      const typeLabels: Record<string, string> = {
        dine_in: 'Masada',
        takeaway: 'Paket',
        delivery: 'Teslimat',
        qr_order: 'QR Sipariş'
      };

      const ordersByType = Object.entries(typeMap)
        .map(([type, value]) => ({ name: typeLabels[type] || type, value }));

      // Sipariş durumları
      const statusMap: Record<string, number> = {};
      allOrders.forEach(order => {
        statusMap[order.status] = (statusMap[order.status] || 0) + 1;
      });

      const statusLabels: Record<string, string> = {
        pending: 'Bekliyor',
        confirmed: 'Onaylandı',
        preparing: 'Hazırlanıyor',
        ready: 'Hazır',
        served: 'Servis Edildi',
        completed: 'Tamamlandı',
        cancelled: 'İptal'
      };

      const ordersByStatus = Object.entries(statusMap)
        .map(([status, value]) => ({ name: statusLabels[status] || status, value }));

      setReportData({
        totalRevenue,
        totalOrders: allOrders.length,
        avgOrderValue,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        dailyRevenue,
        topProducts,
        ordersByType,
        ordersByStatus
      });
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dateRangeLabels: Record<DateRange, string> = {
    today: 'Bugün',
    week: 'Son 7 Gün',
    month: 'Son 30 Gün',
    year: 'Son 1 Yıl'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-500 mt-1">
            {isAllVenues ? `Tüm Mekanlar (${venues.length})` : currentVenue?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex bg-white border rounded-lg overflow-hidden">
            {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {dateRangeLabels[range]}
              </button>
            ))}
          </div>
          <button
            onClick={fetchReportData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reportData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard title="Toplam Ciro" value={`₺${reportData.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
            <KPICard title="Toplam Sipariş" value={reportData.totalOrders} icon={ShoppingBag} color="blue" />
            <KPICard title="Ortalama Sipariş" value={`₺${reportData.avgOrderValue.toFixed(0)}`} icon={TrendingUp} color="purple" />
            <KPICard title="Tamamlanan" value={reportData.completedOrders} icon={ShoppingBag} color="green" />
            <KPICard title="İptal Edilen" value={reportData.cancelledOrders} icon={ShoppingBag} color="red" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Revenue Chart */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Günlük Ciro</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => `₺${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Ciro" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Orders Chart */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Günlük Sipariş</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" name="Sipariş" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">En Çok Satanlar</h3>
              {reportData.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {reportData.topProducts.map((product, idx) => (
                    <div key={product.name} className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.quantity} adet</p>
                      </div>
                      <span className="font-bold text-green-600">₺{product.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Veri yok</p>
              )}
            </div>

            {/* Orders by Type */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sipariş Türleri</h3>
              {reportData.ordersByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.ordersByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {reportData.ordersByType.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Veri yok</p>
              )}
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sipariş Durumları</h3>
              {reportData.ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={reportData.ordersByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {reportData.ordersByStatus.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">Veri yok</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium opacity-80">{title}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
