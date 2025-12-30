'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Users, Clock, Utensils, AlertCircle, Loader2,
  RefreshCw, Edit2, Trash2, ExternalLink, Calendar, Phone,
  User, DollarSign, CheckCircle
} from 'lucide-react';

// ===========================================
// TYPES
// ===========================================
interface TableData {
  id: string;
  venue_id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  is_active: boolean;
  customer_name?: string;
  current_guests?: number;
  seated_at?: string;
}

interface OrderData {
  id: string;
  table_number: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
  customer_name?: string;
}

interface ReservationData {
  id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  table_number: string;
  status: string;
  notes?: string;
  special_requests?: string;
}

// ===========================================
// MAIN COMPONENT
// ===========================================
export default function TablesPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('tables');
  const tCommon = useTranslations('common');
  
  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');

  // Status config with translations
  const statusConfig = {
    available: { label: t('available'), bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', badgeBg: 'bg-green-500' },
    occupied: { label: t('occupied'), bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', badgeBg: 'bg-red-500' },
    reserved: { label: t('reserved'), bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', badgeBg: 'bg-amber-500' },
    cleaning: { label: t('cleaning'), bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', badgeBg: 'bg-blue-500' },
  };

  // Section translations
  const sectionTranslations: Record<string, string> = {
    'Bahçe': t('garden'),
    'İç Mekan': t('indoor'),
    'Dış Mekan': t('outdoor'),
    'Teras': t('terrace'),
    'VIP': t('vip'),
    'Garden': t('garden'),
    'Indoor': t('indoor'),
    'Outdoor': t('outdoor'),
    'Terrace': t('terrace'),
    'Giardino': t('garden'),
    'Interno': t('indoor'),
    'Esterno': t('outdoor'),
    'Terrazza': t('terrace'),
  };

  const translateSection = (section: string) => {
    return sectionTranslations[section] || section;
  };

  // ===========================================
  // DATA LOADING
  // ===========================================
  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: tablesData } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true)
      .order('number');

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
      .not('table_number', 'is', null);

    const { data: reservationsData } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('date', today)
      .in('status', ['pending', 'confirmed']);

    if (tablesData) setTables(tablesData);
    if (ordersData) setOrders(ordersData);
    if (reservationsData) setReservations(reservationsData);
    
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  // ===========================================
  // HELPERS
  // ===========================================
  const getTableOrder = (tableNumber: string): OrderData | undefined => {
    return orders.find(o => o.table_number === tableNumber);
  };

  const getTableReservations = (tableNumber: string): ReservationData[] => {
    return reservations.filter(r => r.table_number === tableNumber);
  };

  const getRealStatus = (table: TableData): 'available' | 'occupied' | 'reserved' | 'cleaning' => {
    const order = getTableOrder(table.number);
    const tableReservations = getTableReservations(table.number);
    
    if (order) return 'occupied';
    if (tableReservations.length > 0) return 'reserved';
    return table.status;
  };

  // Get unique sections
  const sections = ['all', ...Array.from(new Set(tables.map(t => t.section)))];

  // Filter tables
  const filteredTables = activeSection === 'all' 
    ? tables 
    : tables.filter(t => t.section === activeSection);

  // Stats
  const stats = {
    available: tables.filter(t => getRealStatus(t) === 'available').length,
    occupied: tables.filter(t => getRealStatus(t) === 'occupied').length,
    reserved: tables.filter(t => getRealStatus(t) === 'reserved').length,
    cleaning: tables.filter(t => getRealStatus(t) === 'cleaning').length,
  };

  // ===========================================
  // ACTIONS
  // ===========================================
  const handleAddTable = async (data: { number: string; capacity: number; section: string }) => {
    if (!currentVenue?.id) return;

    await supabase.from('tables').insert({
      venue_id: currentVenue.id,
      number: data.number,
      capacity: data.capacity,
      section: data.section,
      status: 'available',
      is_active: true
    });

    setShowAddModal(false);
    loadData();
  };

  const handleUpdateTable = async (id: string, data: Partial<TableData>) => {
    await supabase.from('tables').update(data).eq('id', id);
    setEditingTable(null);
    loadData();
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('tables').update({ is_active: false }).eq('id', id);
    loadData();
  };

  const handleStatusChange = async (table: TableData, newStatus: TableData['status']) => {
    await supabase.from('tables').update({ status: newStatus }).eq('id', table.id);
    loadData();
  };

  // ===========================================
  // RENDER
  // ===========================================
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
          <h1 className="text-2xl font-bold text-white">{currentVenue.name}</h1>
          <p className="text-gray-400">{tables.length} {t('tableCount')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addTable')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          return (
            <div key={status} className={`${config.bg} rounded-xl p-4 border-2 ${config.border}`}>
              <p className={`text-sm font-medium ${config.text}`}>{config.label}</p>
              <p className={`text-3xl font-bold ${config.text}`}>{count}</p>
            </div>
          );
        })}
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
            {section === 'all' ? t('allSections') : translateSection(section)} ({section === 'all' ? tables.length : tables.filter(t => t.section === section).length})
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
              className={`relative ${config.bg} rounded-xl p-4 border-2 ${config.border} cursor-pointer hover:shadow-lg transition-all`}
            >
              {/* Reservation badge */}
              {tableReservations.length > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {tableReservations.length}
                </div>
              )}

              {/* Order badge */}
              {order && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  <Utensils className="w-3 h-3" />
                </div>
              )}

              <h3 className={`text-2xl font-bold ${config.text}`}>{table.number}</h3>
              <p className="text-gray-600 text-sm">{translateSection(table.section)}</p>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <Users className="w-3 h-3" />
                <span>{table.capacity} {t('person')}</span>
              </div>

              {/* Reservation info */}
              {tableReservations[0] && (
                <div className="mt-2 text-xs text-amber-700">
                  <p>{tableReservations[0].time} - {tableReservations[0].customer_name}</p>
                  {tableReservations.length > 1 && <p>+{tableReservations.length - 1} {tCommon('more')}</p>}
                </div>
              )}

              {/* Status badge */}
              <div className={`mt-2 inline-block px-2 py-1 ${config.badgeBg} text-white text-xs rounded-full`}>
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddTableModal
          t={t}
          tCommon={tCommon}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTable}
          sections={sections.filter(s => s !== 'all')}
          translateSection={translateSection}
        />
      )}

      {/* Edit Modal */}
      {editingTable && (
        <EditTableModal
          t={t}
          tCommon={tCommon}
          table={editingTable}
          onClose={() => setEditingTable(null)}
          onSave={(data) => handleUpdateTable(editingTable.id, data)}
          onDelete={() => handleDeleteTable(editingTable.id)}
          sections={sections.filter(s => s !== 'all')}
          translateSection={translateSection}
        />
      )}

      {/* Table Detail Modal */}
      {selectedTable && (
        <TableDetailModal
          t={t}
          tCommon={tCommon}
          table={selectedTable}
          order={getTableOrder(selectedTable.number)}
          reservations={getTableReservations(selectedTable.number)}
          statusConfig={statusConfig}
          onClose={() => setSelectedTable(null)}
          onEdit={() => { setEditingTable(selectedTable); setSelectedTable(null); }}
          onStatusChange={(status) => handleStatusChange(selectedTable, status)}
          translateSection={translateSection}
        />
      )}
    </div>
  );
}

// ===========================================
// ADD TABLE MODAL
// ===========================================
function AddTableModal({ 
  t, tCommon, onClose, onSave, sections, translateSection 
}: { 
  t: any; tCommon: any; onClose: () => void; onSave: (data: any) => void; sections: string[]; translateSection: (s: string) => string;
}) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState(sections[0] || '');
  const [newSection, setNewSection] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ number, capacity, section: newSection || section });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('addTable')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('tableNumber')}</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('capacity')}</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              min={1}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('section')}</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              {sections.map(s => (
                <option key={s} value={s}>{translateSection(s)}</option>
              ))}
              <option value="">{tCommon('newSection')}</option>
            </select>
            {section === '' && (
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder={tCommon('enterSectionName')}
                className="w-full mt-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// EDIT TABLE MODAL
// ===========================================
function EditTableModal({ 
  t, tCommon, table, onClose, onSave, onDelete, sections, translateSection 
}: { 
  t: any; tCommon: any; table: TableData; onClose: () => void; onSave: (data: any) => void; onDelete: () => void; sections: string[]; translateSection: (s: string) => string;
}) {
  const [number, setNumber] = useState(table.number);
  const [capacity, setCapacity] = useState(table.capacity);
  const [section, setSection] = useState(table.section);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ number, capacity, section });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('editTable')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('tableNumber')}</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('capacity')}</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              min={1}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('section')}</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              {sections.map(s => (
                <option key={s} value={s}>{translateSection(s)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="py-2 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================
// TABLE DETAIL MODAL
// ===========================================
function TableDetailModal({ 
  t, tCommon, table, order, reservations, statusConfig, onClose, onEdit, onStatusChange, translateSection 
}: { 
  t: any; tCommon: any; table: TableData; order?: OrderData; reservations: ReservationData[]; 
  statusConfig: any; onClose: () => void; onEdit: () => void; onStatusChange: (status: TableData['status']) => void; translateSection: (s: string) => string;
}) {
  const statuses: TableData['status'][] = ['available', 'occupied', 'reserved', 'cleaning'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{t('tableNumber')} {table.number}</h2>
            <p className="text-gray-400">{translateSection(table.section)} • {table.capacity} {t('person')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Change */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('changeStatus')}</label>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                    table.status === status
                      ? `${statusConfig[status].badgeBg} text-white`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Order */}
          {order && (
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-medium text-white mb-2">{t('currentOrder')}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{order.items?.length || 0} {tCommon('items')}</span>
                <span className="text-orange-400 font-medium">₺{order.total?.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Reservations */}
          {reservations.length > 0 && (
            <div>
              <h3 className="font-medium text-white mb-2">{t('tableReservations')}</h3>
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

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {tCommon('edit')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
