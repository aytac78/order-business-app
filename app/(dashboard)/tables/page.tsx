'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Users, Utensils, AlertCircle, Loader2, RefreshCw,
  Plus, X, Clock, CheckCircle, Sparkles, Edit2, Trash2
} from 'lucide-react';

interface TableData {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_guests?: number;
  shape?: 'square' | 'round' | 'rectangle';
}

interface OrderData {
  id: string;
  table_number: string;
  table_id: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
  guest_count?: number;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
}

interface ReservationData {
  id: string;
  table_number: string;
  customer_name: string;
  time: string;
  party_size: number;
  status: string;
}

const statusConfig = {
  available: { label: 'Müsait', bg: 'bg-green-500', border: 'border-green-500', color: 'text-green-500' },
  occupied: { label: 'Dolu', bg: 'bg-red-500', border: 'border-red-500', color: 'text-red-500' },
  reserved: { label: 'Rezerveli', bg: 'bg-amber-500', border: 'border-amber-500', color: 'text-amber-500' },
  cleaning: { label: 'Temizleniyor', bg: 'bg-blue-500', border: 'border-blue-500', color: 'text-blue-500' },
};

const shapeConfig = {
  square: 'Kare',
  round: 'Yuvarlak',
  rectangle: 'Dikdörtgen',
};

export default function TablesPage() {
  const { currentVenue } = useVenueStore();
  const router = useRouter();

  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Load tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .eq('is_active', true)
        .order('number');

      if (tablesError) console.error('Tables error:', tablesError);

      // Load active orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, table_number, table_id, status, total, items, created_at, notes, customer_name, customer_phone')
        .eq('venue_id', currentVenue.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .eq('payment_status', 'pending');

      if (ordersError) console.error('Orders error:', ordersError);

      // Load today's reservations
      const today = new Date().toISOString().split('T')[0];
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .eq('date', today)
        .in('status', ['pending', 'confirmed']);

      if (reservationsError) console.error('Reservations error:', reservationsError);

      if (tablesData) setTables(tablesData);
      if (ordersData) setOrders(ordersData);
      if (reservationsData) setReservations(reservationsData);
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  const getTableOrder = (tableNumber: string) => {
    return orders.find(o => o.table_number === tableNumber);
  };

  const getTableReservations = (tableNumber: string) => {
    return reservations.filter(r => r.table_number === tableNumber);
  };

  const handleStatusChange = async (tableId: string, newStatus: TableData['status']) => {
    await supabase
      .from('tables')
      .update({ status: newStatus })
      .eq('id', tableId);

    loadData();
    setSelectedTable(null);
  };

  // Masa Ekleme
  const handleAddTable = async (tableData: Partial<TableData>) => {
    if (!currentVenue?.id) return;

    const { error } = await supabase
      .from('tables')
      .insert({
        venue_id: currentVenue.id,
        number: tableData.number,
        capacity: tableData.capacity || 4,
        section: tableData.section || 'Ana Salon',
        shape: tableData.shape || 'square',
        status: 'available',
        is_active: true,
      });

    if (error) {
      console.error('Add table error:', error);
      alert('Masa eklenirken hata oluştu: ' + error.message);
    } else {
      loadData();
      setShowAddModal(false);
    }
  };

  // Masa Düzenleme
  const handleEditTable = async (tableData: Partial<TableData>) => {
    if (!editingTable?.id) return;

    const { error } = await supabase
      .from('tables')
      .update({
        number: tableData.number,
        capacity: tableData.capacity,
        section: tableData.section,
        shape: tableData.shape,
      })
      .eq('id', editingTable.id);

    if (error) {
      console.error('Edit table error:', error);
      alert('Masa güncellenirken hata oluştu: ' + error.message);
    } else {
      loadData();
      setEditingTable(null);
    }
  };

  // Masa Silme (soft delete)
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Bu masayı silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('tables')
      .update({ is_active: false })
      .eq('id', tableId);

    if (error) {
      console.error('Delete table error:', error);
      alert('Masa silinirken hata oluştu: ' + error.message);
    } else {
      loadData();
      setSelectedTable(null);
    }
  };

  // Müşteri ismini çıkar
  const getCustomerName = (order: OrderData): string | null => {
    if (order.customer_name) {
      return order.customer_name;
    }
    if (order.notes) {
      if (order.notes.startsWith('Walk-in: ')) {
        return order.notes.replace('Walk-in: ', '').split(' - ')[0];
      }
      if (order.notes.startsWith('Müşteri: ')) {
        return order.notes.replace('Müşteri: ', '').split(' - ')[0];
      }
      if (order.notes.length < 50 && !order.notes.includes('\n')) {
        return order.notes;
      }
    }
    return null;
  };

  // Kişi sayısını al
  const getGuestCount = (_order: OrderData, table: TableData): number => {
    if (table.current_guests && table.current_guests > 0) {
      return table.current_guests;
    }
    return 1;
  };

  // Get sections
  const sections = [...new Set(tables.map(t => t.section))];
  const filteredTables = selectedSection === 'all'
    ? tables
    : tables.filter(t => t.section === selectedSection);

  // Stats
  const stats = {
    available: tables.filter(t => !getTableOrder(t.number) && !getTableReservations(t.number).length && t.status === 'available').length,
    occupied: tables.filter(t => getTableOrder(t.number) || t.status === 'occupied').length,
    reserved: tables.filter(t => getTableReservations(t.number).length > 0 || t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Lütfen bir mekan seçin</p>
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
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Masalar</h1>
          <p className="text-gray-400">{tables.length} Masa</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Masa Ekle
          </button>
          <button type="button"
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        {Object.entries(statusConfig).map(([key, config]) => (
          <div
            key={key}
            className={`rounded-xl p-4 border-2 ${config.border} bg-opacity-10`}
            style={{ backgroundColor: `${config.bg}20` }}
          >
            <p className={config.color}>{config.label}</p>
            <p className="text-3xl font-bold text-white">{stats[key as keyof typeof stats]}</p>
          </div>
        ))}
      </div>

      {/* Section Filters */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        <button type="button"
          onClick={() => setSelectedSection('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            selectedSection === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Tüm Bölümler ({tables.length})
        </button>
        {sections.map(section => (
          <button type="button"
            key={section}
            onClick={() => setSelectedSection(section)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              selectedSection === section
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {section} ({tables.filter(t => t.section === section).length})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Henüz masa eklenmemiş</p>
            <button type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium"
            >
              İlk Masayı Ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-4">
            {filteredTables.map(table => {
              const order = getTableOrder(table.number);
              const tableReservations = getTableReservations(table.number);
              const realStatus = order ? 'occupied' : tableReservations.length > 0 ? 'reserved' : table.status;
              const config = statusConfig[realStatus];
              const customerName = order ? getCustomerName(order) : null;
              const guestCount = order ? getGuestCount(order, table) : (table.current_guests || 0);

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
                  <p className="text-gray-400 text-sm">{table.section}</p>
                  
                  <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                    <Users className="w-3 h-3" />
                    <span className={guestCount > 0 ? 'text-green-400' : ''}>
                      {guestCount}/{table.capacity} kişi
                    </span>
                  </div>

                  {order && (
                    <div className="mt-2 text-sm">
                      {customerName && (
                        <p className="text-blue-400 text-xs mb-1 truncate" title={customerName}>
                          👤 {customerName}
                        </p>
                      )}
                      <p className="text-orange-400 font-medium">₺{order.total?.toFixed(0)}</p>
                      <p className="text-gray-500">{order.items?.length || 0} ürün</p>
                    </div>
                  )}

                  {!order && tableReservations[0] && (
                    <div className="mt-2 text-xs text-amber-400">
                      <p>{tableReservations[0].time} - {tableReservations[0].customer_name}</p>
                    </div>
                  )}

                  <div className={`mt-2 inline-block px-2 py-1 ${config.bg} text-white text-xs rounded-full`}>
                    {config.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Table Detail Modal */}
      {selectedTable && (
        <TableModal
          table={selectedTable}
          order={getTableOrder(selectedTable.number)}
          reservations={getTableReservations(selectedTable.number)}
          onClose={() => setSelectedTable(null)}
          onStatusChange={(status) => handleStatusChange(selectedTable.id, status)}
          onGoToWaiter={() => router.push('/waiter')}
          onGoToPOS={() => {
            const order = getTableOrder(selectedTable.number);
            if (order) {
              localStorage.setItem('selectedPosTable', JSON.stringify({
                tableId: selectedTable.id,
                tableNumber: selectedTable.number,
                orderId: order.id,
                total: order.total
              }));
            }
            router.push('/pos');
          }}
          onEdit={() => {
            setEditingTable(selectedTable);
            setSelectedTable(null);
          }}
          onDelete={() => handleDeleteTable(selectedTable.id)}
          getCustomerName={getCustomerName}
          getGuestCount={getGuestCount}
        />
      )}

      {/* Add/Edit Table Modal */}
      {(showAddModal || editingTable) && (
        <AddEditTableModal
          table={editingTable}
          sections={sections}
          onSave={editingTable ? handleEditTable : handleAddTable}
          onClose={() => {
            setShowAddModal(false);
            setEditingTable(null);
          }}
        />
      )}
    </div>
  );
}

// Table Detail Modal
function TableModal({
  table, order, reservations, onClose, onStatusChange, onGoToWaiter, onGoToPOS, onEdit, onDelete, getCustomerName, getGuestCount
}: {
  table: TableData;
  order?: OrderData;
  reservations: ReservationData[];
  onClose: () => void;
  onStatusChange: (status: TableData['status']) => void;
  onGoToWaiter: () => void;
  onGoToPOS: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getCustomerName: (order: OrderData) => string | null;
  getGuestCount: (order: OrderData, table: TableData) => number;
}) {
  const realStatus = order ? 'occupied' : reservations.length > 0 ? 'reserved' : table.status;
  const config = statusConfig[realStatus];
  const customerName = order ? getCustomerName(order) : null;
  const guestCount = order ? getGuestCount(order, table) : (table.current_guests || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Masa {table.number}</h2>
              <span className={`px-3 py-1 ${config.bg} text-white text-sm rounded-full`}>
                {config.label}
              </span>
            </div>
            <p className="text-gray-400 mt-1">
              {table.section} • {guestCount}/{table.capacity} kişi
            </p>
            {customerName && (
              <p className="text-blue-400 text-sm mt-1">👤 {customerName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
              <Edit2 className="w-5 h-5" />
            </button>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={onGoToWaiter}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                <Utensils className="w-4 h-4" />
                {order ? 'Siparişe Git' : 'Sipariş Al'}
              </button>
              {order && (
                <button type="button"
                  onClick={onGoToPOS}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Hesap Al
                </button>
              )}
            </div>
          </div>

          {/* Current Order */}
          {order && (
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Mevcut Sipariş</h3>
                <span className="text-orange-400 font-bold">₺{order.total?.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                <span><Users className="w-3 h-3 inline mr-1" />{guestCount} kişi</span>
                <span><Clock className="w-3 h-3 inline mr-1" />{new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="space-y-2">
                {order.items?.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{item.quantity}x {item.product_name}</span>
                    <span className="text-gray-400">₺{item.total_price?.toFixed(0)}</span>
                  </div>
                ))}
                {(order.items?.length || 0) > 5 && (
                  <p className="text-xs text-gray-500">+{order.items!.length - 5} ürün daha</p>
                )}
              </div>
            </div>
          )}

          {/* Reservations */}
          {reservations.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-600 rounded-xl p-4">
              <h3 className="font-medium text-amber-400 mb-2">Rezervasyonlar</h3>
              {reservations.map(res => (
                <div key={res.id} className="flex items-center justify-between text-sm">
                  <span className="text-white">{res.customer_name}</span>
                  <span className="text-amber-400">{res.time} • {res.party_size} kişi</span>
                </div>
              ))}
            </div>
          )}

          {/* Status Change */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Durum Değiştir</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button type="button"
                  key={key}
                  onClick={() => onStatusChange(key as TableData['status'])}
                  className={`py-3 rounded-xl font-medium transition-colors ${
                    realStatus === key
                      ? `${cfg.bg} text-white`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delete Button */}
          {!order && (
            <button type="button"
              onClick={onDelete}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Masayı Sil
            </button>
          )}

          {/* Close Button */}
          <button type="button"
            onClick={onClose}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

// Add/Edit Table Modal
function AddEditTableModal({
  table,
  sections,
  onSave,
  onClose
}: {
  table: TableData | null;
  sections: string[];
  onSave: (data: Partial<TableData>) => void;
  onClose: () => void;
}) {
  const [number, setNumber] = useState(table?.number || '');
  const [capacity, setCapacity] = useState(table?.capacity || 4);
  const [section, setSection] = useState(table?.section || sections[0] || 'Ana Salon');
  const [shape, setShape] = useState<'square' | 'round' | 'rectangle'>(table?.shape || 'square');
  const [newSection, setNewSection] = useState('');
  const [showNewSection, setShowNewSection] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) {
      alert('Masa numarası gerekli');
      return;
    }
    
    setSaving(true);
    await onSave({
      number: number.trim(),
      capacity,
      section: showNewSection && newSection.trim() ? newSection.trim() : section,
      shape,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {table ? 'Masa Düzenle' : 'Yeni Masa Ekle'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Masa Numarası */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Masa Numarası *
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Örn: 1, A1, VIP-1"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          {/* Kapasite */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Kapasite (Kişi)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCapacity(Math.max(1, capacity - 1))}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold text-xl"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-16 text-center">{capacity}</span>
              <button
                type="button"
                onClick={() => setCapacity(Math.min(20, capacity + 1))}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-bold text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Bölüm */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Bölüm
            </label>
            {!showNewSection ? (
              <div className="space-y-2">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-orange-500"
                >
                  {sections.length === 0 && <option value="Ana Salon">Ana Salon</option>}
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewSection(true)}
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  + Yeni Bölüm Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="Yeni bölüm adı"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewSection(false)}
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  Mevcut Bölümlerden Seç
                </button>
              </div>
            )}
          </div>

          {/* Şekil */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Masa Şekli
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(shapeConfig).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShape(key as typeof shape)}
                  className={`py-3 rounded-xl font-medium transition-colors ${
                    shape === key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                table ? 'Güncelle' : 'Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}