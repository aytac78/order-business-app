'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Clock, RefreshCw, ArrowUpRight, ArrowDownRight, Building2
} from 'lucide-react';

export default function AnalyticsPage() {
  const { currentVenue, venues } = useVenueStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAllVenues = currentVenue === null;

  useEffect(() => {
    fetchAnalytics();
  }, [currentVenue?.id]);

  const fetchAnalytics = async () => {
    setIsLoading(true);

    try {
      // Son 30 günlük veriler
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (!isAllVenues && currentVenue?.id) {
        query = query.eq('venue_id', currentVenue.id);
      }

      const { data: orders } = await query;
      const allOrders = orders || [];

      // Debug: Sipariş venue_id'lerini kontrol et
      console.log('Tüm siparişler:', allOrders.length);
      console.log('Sipariş venue_ids:', Array.from(new Set(allOrders.map(o => o.venue_id))));
      console.log('Venues:', venues.map(v => ({ id: v.id, name: v.name })));

      // Son 7 gün vs önceki 7 gün
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const thisWeekOrders = allOrders.filter(o => new Date(o.created_at) >= sevenDaysAgo);
      const lastWeekOrders = allOrders.filter(o => 
        new Date(o.created_at) >= fourteenDaysAgo && new Date(o.created_at) < sevenDaysAgo
      );

      // Ciro hesaplama - tüm durumlardaki siparişleri say (completed olmasa bile)
      const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);
      const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);

      const revenueChange = lastWeekRevenue > 0 
        ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
        : 0;

      const ordersChange = lastWeekOrders.length > 0
        ? ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100
        : 0;

      // Saatlik dağılım
      const hourlyData: Record<number, { orders: number; revenue: number }> = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { orders: 0, revenue: 0 };
      }
      
      allOrders.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourlyData[hour].orders++;
        hourlyData[hour].revenue += (order.total_amount || order.total || 0);
      });

      const hourlyChart = Object.entries(hourlyData).map(([hour, d]) => ({
        hour: `${hour}:00`,
        ...d
      }));

      // Haftalık trend
      const weeklyData: Record<string, { revenue: number; orders: number }> = {};
      const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      days.forEach(day => {
        weeklyData[day] = { revenue: 0, orders: 0 };
      });

      allOrders.forEach(order => {
        const dayIndex = new Date(order.created_at).getDay();
        const day = days[dayIndex];
        weeklyData[day].orders++;
        weeklyData[day].revenue += (order.total_amount || order.total || 0);
      });

      const weeklyChart = days.map(day => ({ day, ...weeklyData[day] }));

      // Mekan bazlı performans - venue_id'ye göre grupla
      const venueMap: Record<string, { name: string; orders: number; revenue: number }> = {};
      
      allOrders.forEach(order => {
        const venueId = order.venue_id;
        if (!venueMap[venueId]) {
          // Venue ismini bul - önce venues listesinden, yoksa venue_name alanından
          const venue = venues.find(v => v.id === venueId);
          venueMap[venueId] = {
            name: venue?.name || order.venue_name || `Mekan ${venueId?.slice(0, 8)}`,
            orders: 0,
            revenue: 0
          };
        }
        venueMap[venueId].orders++;
        venueMap[venueId].revenue += (order.total_amount || order.total || 0);
      });

      const venuePerformance = Object.values(venueMap)
        .map(v => ({
          ...v,
          avgOrder: v.orders > 0 ? v.revenue / v.orders : 0
        }))
        .sort((a, b) => b.orders - a.orders);

      console.log('Mekan performansı:', venuePerformance);

      // En yoğun saat
      const peakHourEntry = Object.entries(hourlyData).sort((a, b) => b[1].orders - a[1].orders)[0];
      const peakHour = peakHourEntry ? peakHourEntry[0] : '19';

      setData({
        thisWeekRevenue,
        lastWeekRevenue,
        revenueChange,
        thisWeekOrders: thisWeekOrders.length,
        lastWeekOrders: lastWeekOrders.length,
        ordersChange,
        totalOrders: allOrders.length,
        hourlyChart,
        weeklyChart,
        venuePerformance,
        peakHour,
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
          <p className="text-gray-500 mt-1">
            {isAllVenues ? `Tüm Mekanlar (${venues.length})` : currentVenue?.name} • Son 30 gün
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : data && (
        <>
          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ComparisonCard
              title="Bu Hafta Ciro"
              value={`₺${data.thisWeekRevenue.toLocaleString()}`}
              change={data.revenueChange}
              lastValue={`₺${data.lastWeekRevenue.toLocaleString()}`}
            />
            <ComparisonCard
              title="Bu Hafta Sipariş"
              value={data.thisWeekOrders}
              change={data.ordersChange}
              lastValue={data.lastWeekOrders}
            />
            <ComparisonCard
              title="Toplam Sipariş (30 gün)"
              value={data.totalOrders}
              neutral
            />
            <ComparisonCard
              title="En Yoğun Saat"
              value={`${data.peakHour}:00`}
              neutral
            />
          </div>

          {/* Hourly Distribution */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Saatlik Sipariş Dağılımı (30 gün)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.hourlyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="orders" name="Sipariş" stroke="#f97316" fill="#fed7aa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Trend */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Haftalık Ciro Trendi (30 gün)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.weeklyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₺${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" name="Ciro" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Haftalık Sipariş Trendi (30 gün)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.weeklyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" name="Sipariş" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Venue Performance */}
          {data.venuePerformance.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Mekan Performansı (30 gün)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Mekan</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Sipariş</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Ciro</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Ort. Sipariş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.venuePerformance.map((venue: any, idx: number) => (
                      <tr key={venue.name} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-medium">{venue.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">{venue.orders}</td>
                        <td className="text-right py-3 px-4 font-bold text-green-600">₺{venue.revenue.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-gray-600">₺{venue.avgOrder.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComparisonCard({ title, value, change, lastValue, neutral }: any) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl border p-4">
      <span className="text-sm text-gray-500">{title}</span>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {!neutral && change !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">Geçen hafta: {lastValue}</span>
        </div>
      )}
    </div>
  );
}
