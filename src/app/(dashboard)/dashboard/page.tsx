'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Users, Calendar, DollarSign, Clock,
  AlertTriangle, ArrowUpRight, RefreshCw, Utensils, CreditCard, Building2
} from 'lucide-react';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  todayReservations: number;
  activeStaff: number;
  avgOrderValue: number;
}

interface VenueStats {
  venue_id: string;
  venue_name: string;
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
}

export default function DashboardPage() {
  const { currentVenue, venues } = useVenueStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [venueStats, setVenueStats] = useState<VenueStats[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAllVenues = currentVenue === null;

  useEffect(() => {
    fetchDashboardData();
  }, [currentVenue?.id, venues]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      if (isAllVenues) {
        // TÜM MEKANLAR - Toplu veri çek
        const [ordersRes, staffRes] = await Promise.all([
          supabase.from('orders').select('*'),
          supabase.from('staff').select('*'),
        ]);

        const allOrders = ordersRes.data || [];
        const allStaff = staffRes.data || [];

        const todayOrders = allOrders.filter(o => o.created_at?.startsWith(today));
        const pendingOrders = allOrders.filter(o => ['pending', 'preparing'].includes(o.status));
        const completedOrders = todayOrders.filter(o => o.status === 'completed');
        const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);

        // Mekan bazlı istatistikler
        const venueStatsMap: Record<string, VenueStats> = {};
        venues.forEach(v => {
          venueStatsMap[v.id] = {
            venue_id: v.id,
            venue_name: v.name,
            todayRevenue: 0,
            todayOrders: 0,
            pendingOrders: 0,
          };
        });

        allOrders.forEach(order => {
          if (venueStatsMap[order.venue_id]) {
            if (order.created_at?.startsWith(today)) {
              venueStatsMap[order.venue_id].todayOrders++;
              if (order.status === 'completed') {
                venueStatsMap[order.venue_id].todayRevenue += (order.total_amount || order.total || 0);
              }
            }
            if (['pending', 'preparing'].includes(order.status)) {
              venueStatsMap[order.venue_id].pendingOrders++;
            }
          }
        });

        setVenueStats(Object.values(venueStatsMap));

        setStats({
          todayRevenue,
          todayOrders: todayOrders.length,
          pendingOrders: pendingOrders.length,
          todayReservations: 0,
          activeStaff: allStaff.length,
          avgOrderValue: completedOrders.length > 0 ? todayRevenue / completedOrders.length : 0,
        });

        setRecentOrders(allOrders.slice(0, 10));
      } else {
        // TEK MEKAN
        const [ordersRes, staffRes] = await Promise.all([
          supabase.from('orders').select('*').eq('venue_id', currentVenue.id),
          supabase.from('staff').select('*').eq('venue_id', currentVenue.id),
        ]);

        const orders = ordersRes.data || [];
        const todayOrders = orders.filter(o => o.created_at?.startsWith(today));
        const pendingOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status));
        const completedOrders = todayOrders.filter(o => o.status === 'completed');
        const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);

        setStats({
          todayRevenue,
          todayOrders: todayOrders.length,
          pendingOrders: pendingOrders.length,
          todayReservations: 0,
          activeStaff: staffRes.data?.length || 0,
          avgOrderValue: completedOrders.length > 0 ? todayRevenue / completedOrders.length : 0,
        });

        setRecentOrders(orders.slice(0, 5));
        setVenueStats([]);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {isAllVenues ? `Tüm Mekanlar (${venues.length})` : currentVenue?.name} • Bugünün özeti
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
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
      ) : (
        <>
          {/* Ana İstatistikler */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Bugünkü Ciro" value={`₺${stats?.todayRevenue?.toLocaleString() || 0}`} icon={DollarSign} color="green" trend={12.5} />
            <StatCard title="Sipariş Sayısı" value={stats?.todayOrders || 0} icon={ShoppingBag} color="blue" trend={8.2} />
            <StatCard title="Bekleyen Sipariş" value={stats?.pendingOrders || 0} icon={Clock} color="orange" />
            <StatCard title="Aktif Personel" value={stats?.activeStaff || 0} icon={Users} color="purple" />
          </div>

          {/* Mekan Bazlı İstatistikler - Sadece Tüm Mekanlar modunda */}
          {isAllVenues && venueStats.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Mekan Bazlı Özet
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {venueStats.map((vs) => (
                  <div key={vs.venue_id} className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">{vs.venue_name}</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Ciro</p>
                        <p className="font-bold text-green-600">₺{vs.todayRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sipariş</p>
                        <p className="font-bold text-blue-600">{vs.todayOrders}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bekleyen</p>
                        <p className="font-bold text-orange-600">{vs.pendingOrders}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hızlı Erişim */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/orders" className="flex items-center gap-3 p-4 rounded-xl text-white bg-blue-500 hover:bg-blue-600">
              <ShoppingBag className="w-6 h-6" /><span className="font-medium">Siparişler</span>
            </Link>
            <Link href="/pos" className="flex items-center gap-3 p-4 rounded-xl text-white bg-green-500 hover:bg-green-600">
              <CreditCard className="w-6 h-6" /><span className="font-medium">Kasa/POS</span>
            </Link>
            <Link href="/reservations" className="flex items-center gap-3 p-4 rounded-xl text-white bg-purple-500 hover:bg-purple-600">
              <Calendar className="w-6 h-6" /><span className="font-medium">Rezervasyonlar</span>
            </Link>
            <Link href="/kitchen" className="flex items-center gap-3 p-4 rounded-xl text-white bg-orange-500 hover:bg-orange-600">
              <Utensils className="w-6 h-6" /><span className="font-medium">Mutfak</span>
            </Link>
          </div>

          {/* Son Siparişler */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Son Siparişler</h2>
              <Link href="/orders" className="text-sm text-orange-600 hover:underline">Tümünü Gör →</Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {isAllVenues && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {venues.find(v => v.id === order.venue_id)?.name?.slice(0, 15) || 'Mekan'}
                        </span>
                      )}
                      <span className="font-mono font-medium">{order.table_number || order.id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>{order.status}</span>
                    </div>
                    <span className="font-bold">₺{(order.total_amount || order.total || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Henüz sipariş yok</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, small }: any) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        {trend && <span className="flex items-center text-xs text-green-600"><ArrowUpRight className="w-3 h-3" />{trend}%</span>}
      </div>
      <p className={`font-bold ${small ? 'text-xl' : 'text-2xl'}`}>{value}</p>
      <p className="text-sm opacity-80">{title}</p>
    </div>
  );
}
