'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Users, Clock, Utensils, AlertCircle, Loader2, RefreshCw,
  Plus, X, Bell, CreditCard, ChefHat, Coffee, CheckCircle,
  Phone, Calendar, ArrowRight, Merge, Split
} from 'lucide-react';

interface TableData {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

interface OrderData {
  id: string;
  table_number: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
}

interface ReservationData {
  id: string;
  customer_name: string;
  customer_phone: string;
  time: string;
  party_size: number;
  table_number: string;
  status: string;
}

export default function WaiterPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('waiter');
  const tTables = useTranslations('tables');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');

  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');

  // Status config
  const statusConfig = {
    available: { label: tTables('available'), bg: 'bg-green-500', border: 'border-green-400' },
    occupied: { label: tTables('occupied'), bg: 'bg-red-500', border: 'border-red-400' },
    reserved: { label: tTables('reserved'), bg: 'bg-amber-500', border: 'border-amber-400' },
    cleaning: { label: tTables('cleaning'), bg: 'bg-blue-500', border: 'border-blue-400' },
  };

  // Section translations
  const sectionTranslations: Record<string, string> = {
    'Bahçe': tTables('garden'),
    'İç Mekan': tTables('indoor'),
    'Dış Mekan': tTables('outdoor'),
    'Teras': tTables('terrace'),
    'VIP': tTables('vip'),
  };

  const translateSection = (section: string) => sectionTranslations[section] || section;

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const [tablesRes, ordersRes, reservationsRes] = await Promise.all([
      supabase.from('tables').select('*').eq('venue_id', currentVenue.id).eq('is_active', true).order('number'),
      supabase.from('orders').select('*').eq('venue_id', currentVenue.id).in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served']).not('table_number', 'is', null),
      supabase.from('reservations').select('*').eq('venue_id', currentVenue.id).eq('date', today).in('status', ['pending', 'confirmed'])
    ]);

    if (tablesRes.data) setTables(tablesRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (reservationsRes.data) setReservations(reservationsRes.data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('waiter-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  const getTableOrder = (tableNumber: string) => orders.find(o => o.table_number === tableNumber);
  const getTableReservations = (tableNumber: string) => reservations.filter(r => r.table_number === tableNumber);

  const getRealStatus = (table: TableData): 'available' | 'occupied' | 'reserved' | 'cleaning' => {
    const order = getTableOrder(table.number);
    const tableReservations = getTableReservations(table.number);
    if (order) return 'occupied';
    if (tableReservations.length > 0) return 'reserved';
    return table.status;
  };

  const sections = ['all', ...Array.from(new Set(tables.map(t => t.section)))];
  const filteredTables = activeSection === 'all' ? tables : tables.filter(t => t.section === activeSection);

  // Stats
  const stats = {
    available: tables.filter(t => getRealStatus(t) === 'available').length,
    occupied: tables.filter(t => getRealStatus(t) === 'occupied').length,
    reserved: tables.filter(t => getRealStatus(t) === 'reserved').length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
  };

  const handleStatusChange = async (tableId: string, newStatus: TableData['status']) => {
    await supabase.from('tables').update({ status: newStatus }).eq('id', tableId);
    loadData();
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
          <p className="text-gray-400">{tables.length} {tTables('tableCount')}</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {tCommon('refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{tTables('available')}</p>
          <p className="text-2xl font-bold text-white">{stats.available}</p>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400 text-sm">{tTables('occupied')}</p>
          <p className="text-2xl font-bold text-white">{stats.occupied}</p>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{tTables('reserved')}</p>
          <p className="text-2xl font-bold text-white">{stats.reserved}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">{tOrders('activeOrders')}</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
          <p className="text-orange-400 text-sm">{tCommon('total')}</p>
          <p className="text-2xl font-bold text-white">₺{stats.totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activeSection === section
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {section === 'all' ? tTables('allSections') : translateSection(section)}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredTables.map(table => {
          const realStatus = getRealStatus(table);
          const config = statusConfig[realStatus];
          const order = getTableOrder(table.number);
          const tableReservations = getTableReservations(table.number);

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`relative rounded-xl p-4 cursor-pointer hover:scale-105 transition-all border-2 ${config.border} ${
                realStatus === 'available' ? 'bg-green-900/30' :
                realStatus === 'occupied' ? 'bg-red-900/30' :
                realStatus === 'reserved' ? 'bg-amber-900/30' :
                'bg-blue-900/30'
              }`}
            >
              {/* Badges */}
              {tableReservations.length > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {tableReservations.length}
                </div>
              )}
              {order && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Utensils className="w-3 h-3 text-white" />
                </div>
              )}

              <h3 className="text-2xl font-bold text-white">{table.number}</h3>
              <p className="text-gray-400 text-sm">{translateSection(table.section)}</p>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <Users className="w-3 h-3" />
                <span>{table.capacity}</span>
              </div>

              {/* Order info */}
              {order && (
                <div className="mt-2 text-sm">
                  <p className="text-orange-400 font-medium">₺{order.total?.toFixed(0)}</p>
                  <p className="text-gray-500">{order.items?.length || 0} {tCommon('items')}</p>
                </div>
              )}

              {/* Reservation info */}
              {!order && tableReservations[0] && (
                <div className="mt-2 text-xs text-amber-400">
                  <p>{tableReservations[0].time} - {tableReservations[0].customer_name}</p>
                </div>
              )}

              {/* Status badge */}
              <div className={`mt-2 inline-block px-2 py-1 ${config.bg} text-white text-xs rounded-full`}>
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail Modal */}
      {selectedTable && (
        <TableActionModal
          table={selectedTable}
          order={getTableOrder(selectedTable.number)}
          reservations={getTableReservations(selectedTable.number)}
          statusConfig={statusConfig}
          t={t}
          tTables={tTables}
          tOrders={tOrders}
          tCommon={tCommon}
          translateSection={translateSection}
          onClose={() => setSelectedTable(null)}
          onStatusChange={(status) => handleStatusChange(selectedTable.id, status)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

// Table Action Modal
function TableActionModal({
  table, order, reservations, statusConfig, t, tTables, tOrders, tCommon, translateSection, onClose, onStatusChange, onRefresh
}: {
  table: TableData;
  order?: OrderData;
  reservations: ReservationData[];
  statusConfig: any;
  t: any;
  tTables: any;
  tOrders: any;
  tCommon: any;
  translateSection: (s: string) => string;
  onClose: () => void;
  onStatusChange: (status: TableData['status']) => void;
  onRefresh: () => void;
}) {
  const realStatus = order ? 'occupied' : reservations.length > 0 ? 'reserved' : table.status;
  const config = statusConfig[realStatus];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{tTables('tableNumber')} {table.number}</h2>
              <span className={`px-3 py-1 ${config.bg} text-white text-sm rounded-full`}>
                {config.label}
              </span>
            </div>
            <p className="text-gray-400 mt-1">{translateSection(table.section)} • {table.capacity} {tTables('person')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('quickActions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {!order && (
                <button className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors">
                  <Plus className="w-4 h-4" />
                  {t('takeOrder')}
                </button>
              )}
              {order && (
                <>
                  <button className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    {t('addToOrder')}
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                    <CreditCard className="w-4 h-4" />
                    {t('requestBill')}
                  </button>
                </>
              )}
              <button className="flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors">
                <Bell className="w-4 h-4" />
                {t('callWaiter')}
              </button>
              {order && (
                <button className="flex items-center justify-center gap-2 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors">
                  <Split className="w-4 h-4" />
                  {t('split')}
                </button>
              )}
            </div>
          </div>

          {/* Active Order */}
          {order && (
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">{tTables('currentOrder')}</h3>
                <span className="text-orange-400 font-bold">₺{order.total?.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                {order.items?.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{item.quantity}x {item.name || item.product_name}</span>
                    <span className="text-gray-400">₺{((item.price || item.unit_price || 0) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                {order.items?.length > 5 && (
                  <p className="text-xs text-gray-500">+{order.items.length - 5} {tCommon('more')} {tCommon('items')}</p>
                )}
              </div>
            </div>
          )}

          {/* Reservations */}
          {reservations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">{tTables('tableReservations')}</h3>
              <div className="space-y-2">
                {reservations.map(res => (
                  <div key={res.id} className="bg-amber-900/30 border border-amber-700 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{res.customer_name}</span>
                      <span className="text-amber-400">{res.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span><Users className="w-3 h-3 inline mr-1" />{res.party_size}</span>
                      <span><Phone className="w-3 h-3 inline mr-1" />{res.customer_phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Change */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">{tTables('changeStatus')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['available', 'occupied', 'reserved', 'cleaning'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                    table.status === status
                      ? `${statusConfig[status].bg} text-white`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
          >
            {tCommon('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
