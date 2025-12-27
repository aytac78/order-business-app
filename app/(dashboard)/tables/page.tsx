'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Users,
  RefreshCw,
  Edit,
  Trash2,
  X,
  Armchair,
  CircleDot,
  Square,
  RectangleHorizontal,
  AlertCircle,
  Bell,
  Clock,
  Receipt,
  ChefHat,
  CheckCircle,
  ShoppingBag,
  UserCircle,
  Timer,
  ExternalLink
} from 'lucide-react';

// Types
interface OrderItem {
  id?: string;
  name?: string;
  product_name?: string;
  price?: number;
  unit_price?: number;
  quantity: number;
  total_price?: number;
  status?: string;
}

interface ActiveOrder {
  id: string;
  order_number: string;
  table_number: string;
  status: string;
  total: number;
  subtotal: number;
  items: any;
  created_at: string;
  paid_amount: number;
}

interface TableData {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: string;
  shape: string;
  position: { x: number; y: number };
  current_guests?: number;
  customer_name?: string;
  seated_at?: string;
}

// Config
const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Boş', color: 'bg-green-100 border-green-400 text-green-800' },
  occupied: { label: 'Dolu', color: 'bg-red-100 border-red-400 text-red-800' },
  reserved: { label: 'Rezerve', color: 'bg-amber-100 border-amber-400 text-amber-800' },
  cleaning: { label: 'Temizleniyor', color: 'bg-blue-100 border-blue-400 text-blue-800' },
};

const orderStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-800', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  preparing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-800', icon: ChefHat },
  ready: { label: 'Hazır', color: 'bg-green-100 text-green-800', icon: Bell },
  served: { label: 'Servis Edildi', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

const shapeIcons: Record<string, any> = {
  square: Square,
  round: CircleDot,
  rectangle: RectangleHorizontal,
};

// Items parser - her iki formatı da destekle
const parseItems = (items: any): OrderItem[] => {
  if (!items) return [];
  
  if (Array.isArray(items)) {
    return items.map(item => ({
      id: item.id || '',
      name: item.product_name || item.name || 'Ürün',
      price: Number(item.unit_price || item.price) || 0,
      quantity: Number(item.quantity) || 1,
      total_price: Number(item.total_price) || (Number(item.quantity || 1) * Number(item.unit_price || item.price || 0)),
      status: item.status || 'pending'
    }));
  }
  
  if (typeof items === 'string') {
    try {
      return parseItems(JSON.parse(items));
    } catch {
      return [];
    }
  }
  
  return [];
};

export default function TablesPage() {
  const { currentVenue } = useVenueStore();
  const [tables, setTables] = useState<TableData[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showTableDetail, setShowTableDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);

  // Load tables
  const loadTables = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('table_number');
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      const formattedTables: TableData[] = (data || []).map(t => ({
        id: t.id,
        number: t.table_number,
        capacity: t.capacity || 4,
        status: t.status || 'available',
        shape: t.shape || 'square',
        section: t.section || 'İç Mekan',
        position: { x: t.position_x || 0, y: t.position_y || 0 },
        current_guests: t.current_guests,
        customer_name: t.customer_name,
        seated_at: t.seated_at
      }));
      setTables(formattedTables);
    } catch (err) {
      setError('Masalar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue?.id]);

  // Load orders
  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .not('table_number', 'is', null);
      
      setActiveOrders((data || []).map(o => ({
        ...o,
        paid_amount: Number(o.paid_amount) || 0
      })));
    } catch (err) {
      console.error('Orders error:', err);
    }
  }, [currentVenue?.id]);

  useEffect(() => {
    loadTables();
    fetchOrders();
  }, [loadTables, fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!currentVenue?.id) return;
    
    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, loadTables)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [currentVenue?.id, fetchOrders, loadTables]);

  // Helpers
  const getTableOrders = (tableNumber: string) => activeOrders.filter(o => o.table_number === tableNumber);
  
  const getRealStatus = (table: TableData) => {
    const hasOrders = getTableOrders(table.number).length > 0;
    const hasGuests = table.current_guests && table.current_guests > 0;
    if (hasOrders || hasGuests) return 'occupied';
    if (table.status === 'reserved') return 'reserved';
    if (table.status === 'cleaning') return 'cleaning';
    return 'available';
  };

  const getSeatedDuration = (seatedAt?: string) => {
    if (!seatedAt) return '-';
    const diff = Math.floor((Date.now() - new Date(seatedAt).getTime()) / 60000);
    return diff < 60 ? `${diff} dk` : `${Math.floor(diff / 60)} sa ${diff % 60} dk`;
  };

  const getSeatedTime = (seatedAt?: string) => {
    if (!seatedAt) return '-';
    return new Date(seatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // CRUD operations
  const addTable = async (data: any) => {
    if (!currentVenue?.id) return;
    await supabase.from('tables').insert({
      venue_id: currentVenue.id,
      table_number: data.number,
      capacity: data.capacity,
      section: data.section,
      shape: data.shape,
      status: 'available'
    });
    loadTables();
  };

  const updateTable = async (id: string, updates: any) => {
    await supabase.from('tables').update(updates).eq('id', id);
    loadTables();
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;
    await supabase.from('tables').delete().eq('id', id);
    loadTables();
  };

  const seatTable = async (tableId: string, guestCount: number, customerName?: string) => {
    await supabase.from('tables').update({
      status: 'occupied',
      current_guests: guestCount,
      customer_name: customerName || null,
      seated_at: new Date().toISOString()
    }).eq('id', tableId);
    loadTables();
  };

  const clearTable = async (tableId: string) => {
    await supabase.from('tables').update({
      status: 'cleaning',
      current_guests: null,
      customer_name: null,
      seated_at: null
    }).eq('id', tableId);
    loadTables();
  };

  // Computed
  const sections = ['all', ...Array.from(new Set(tables.map(t => t.section)))];
  const filteredTables = selectedSection === 'all' ? tables : tables.filter(t => t.section === selectedSection);
  
  const stats = {
    available: tables.filter(t => getRealStatus(t) === 'available').length,
    occupied: tables.filter(t => getRealStatus(t) === 'occupied').length,
    reserved: tables.filter(t => getRealStatus(t) === 'reserved').length,
    cleaning: tables.filter(t => getRealStatus(t) === 'cleaning').length,
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500">Lütfen bir mekan seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Masa Yönetimi</h1>
          <p className="text-gray-500">{currentVenue.name} • {tables.length} masa</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadTables(); fetchOrders(); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            <Plus className="w-4 h-4" />
            Masa Ekle
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Hata: {error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          const config = statusConfig[key];
          return (
            <div key={key} className={`rounded-xl p-4 border-2 ${config.color}`}>
              <p className="text-sm font-semibold">{config.label}</p>
              <p className="text-4xl font-bold">{value}</p>
            </div>
          );
        })}
      </div>

      {/* Section Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedSection === section ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {section === 'all' ? 'Tümü' : section} ({section === 'all' ? tables.length : tables.filter(t => t.section === section).length})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTables.map(table => {
          const orders = getTableOrders(table.number);
          const hasOrder = orders.length > 0;
          const hasReadyOrder = orders.some(o => o.status === 'ready');
          const totalAmount = orders.reduce((sum, o) => sum + Math.max(0, (o.total || 0) - (o.paid_amount || 0)), 0);
          const realStatus = getRealStatus(table);
          const config = statusConfig[realStatus];
          const ShapeIcon = shapeIcons[table.shape] || Square;

          return (
            <div
              key={table.id}
              onClick={() => { setSelectedTable(table); setShowTableDetail(true); }}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${config.color} ${
                hasReadyOrder ? 'ring-4 ring-green-400 animate-pulse' : ''
              }`}
            >
              {/* Badges */}
              {hasReadyOrder && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <Bell className="w-4 h-4 text-white" />
                </div>
              )}
              {hasOrder && !hasReadyOrder && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">{orders.length}</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-2xl">{table.number}</h3>
                  <p className="text-xs font-medium opacity-70">{table.section}</p>
                </div>
                <ShapeIcon className="w-5 h-5 opacity-50" />
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Users className="w-4 h-4" />
                <span>{table.capacity} kişilik</span>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                realStatus === 'occupied' ? 'bg-red-200 text-red-800' :
                realStatus === 'reserved' ? 'bg-amber-200 text-amber-800' :
                realStatus === 'cleaning' ? 'bg-blue-200 text-blue-800' :
                'bg-green-200 text-green-800'
              }`}>
                {hasReadyOrder ? '🔔 HAZIR!' : config.label}
              </div>

              {/* Occupied Info */}
              {realStatus === 'occupied' && (
                <div className="mt-3 pt-3 border-t-2 border-current/20 space-y-1.5">
                  {table.current_guests && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <UserCircle className="w-4 h-4" />
                      <span className="font-semibold">{table.current_guests} kişi</span>
                    </div>
                  )}
                  {table.customer_name && (
                    <p className="text-sm font-medium truncate">{table.customer_name}</p>
                  )}
                  {table.seated_at && (
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <Timer className="w-3 h-3" />
                      <span>{getSeatedTime(table.seated_at)} • {getSeatedDuration(table.seated_at)}</span>
                    </div>
                  )}
                  {hasOrder && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs opacity-70">{orders.length} sipariş</span>
                      <span className="font-bold">₺{totalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-current/10" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingTable(table); setShowAddModal(true); }} className="p-1.5 hover:bg-black/10 rounded" title="Düzenle">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => deleteTable(table.id)} className="p-1.5 hover:bg-red-200 rounded text-red-600" title="Sil">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Armchair className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henüz masa eklenmemiş</p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <TableModal
          table={editingTable}
          onSave={(data) => {
            if (editingTable) {
              updateTable(editingTable.id, { table_number: data.number, capacity: data.capacity, section: data.section, shape: data.shape });
            } else {
              addTable(data);
            }
            setShowAddModal(false);
            setEditingTable(null);
          }}
          onClose={() => { setShowAddModal(false); setEditingTable(null); }}
        />
      )}

      {showTableDetail && selectedTable && (
        <TableDetailModal
          table={selectedTable}
          orders={getTableOrders(selectedTable.number)}
          onClose={() => { setShowTableDetail(false); setSelectedTable(null); }}
          onStatusChange={(status) => updateTable(selectedTable.id, { status })}
          onSeatTable={(count, name) => seatTable(selectedTable.id, count, name)}
          onClearTable={() => clearTable(selectedTable.id)}
          getSeatedDuration={getSeatedDuration}
          getSeatedTime={getSeatedTime}
        />
      )}
    </div>
  );
}

// Table Detail Modal - READ ONLY for orders, no payment
function TableDetailModal({
  table,
  orders,
  onClose,
  onStatusChange,
  onSeatTable,
  onClearTable,
  getSeatedDuration,
  getSeatedTime
}: {
  table: TableData;
  orders: ActiveOrder[];
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onSeatTable: (count: number, name?: string) => void;
  onClearTable: () => void;
  getSeatedDuration: (s?: string) => string;
  getSeatedTime: (s?: string) => string;
}) {
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('');

  const hasOrders = orders.length > 0;
  const isOccupied = hasOrders || table.status === 'occupied' || (table.current_guests && table.current_guests > 0);
  
  const originalTotal = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const remainingAmount = Math.max(0, originalTotal - totalPaid);

  const allItems = orders.flatMap(o => parseItems(o.items));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b-2 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-md ${
              isOccupied ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {table.number}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Masa {table.number}</h2>
              <p className="text-sm text-gray-600">{table.section} • {table.capacity} kişilik</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isOccupied ? (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  Oturum Bilgileri
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Kişi Sayısı</p>
                    <p className="text-xl font-bold">{table.current_guests || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Oturma Saati</p>
                    <p className="text-xl font-bold">{getSeatedTime(table.seated_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Geçen Süre</p>
                    <p className="text-xl font-bold">{getSeatedDuration(table.seated_at)}</p>
                  </div>
                </div>
                {table.customer_name && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Müşteri</p>
                    <p className="text-lg font-semibold">{table.customer_name}</p>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-100 rounded-xl p-4 text-center border-2 border-blue-200">
                  <Receipt className="w-7 h-7 mx-auto mb-2 text-blue-600" />
                  <p className="text-3xl font-bold text-blue-700">{orders.length}</p>
                  <p className="text-sm font-semibold text-blue-600">Sipariş</p>
                </div>
                <div className="bg-purple-100 rounded-xl p-4 text-center border-2 border-purple-200">
                  <Clock className="w-7 h-7 mx-auto mb-2 text-purple-600" />
                  <p className="text-3xl font-bold text-purple-700">{getSeatedDuration(table.seated_at)}</p>
                  <p className="text-sm font-semibold text-purple-600">Süre</p>
                </div>
                <div className="bg-green-100 rounded-xl p-4 text-center border-2 border-green-200">
                  <Receipt className="w-7 h-7 mx-auto mb-2 text-green-600" />
                  <p className="text-3xl font-bold text-green-700">₺{remainingAmount.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-green-600">{totalPaid > 0 ? 'Kalan' : 'Toplam'}</p>
                </div>
              </div>

              {/* Paid info */}
              {totalPaid > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Kısmi Ödeme Yapıldı</p>
                      <p className="text-xs text-amber-600">Orijinal: ₺{originalTotal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-amber-700">₺{totalPaid.toLocaleString()}</p>
                      <p className="text-xs text-amber-600">Ödenen</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders List - READ ONLY */}
              {hasOrders ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Siparişler</h3>
                    <a
                      href="/pos"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      Ödeme için POS'a git
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  {orders.map(order => {
                    const statusConf = orderStatusConfig[order.status] || orderStatusConfig.pending;
                    const StatusIcon = statusConf.icon;
                    const orderItems = parseItems(order.items);
                    const orderPaid = order.paid_amount || 0;
                    const orderRemaining = Math.max(0, (order.total || 0) - orderPaid);

                    return (
                      <div key={order.id} className="border-2 rounded-xl overflow-hidden shadow-sm">
                        <div className={`px-4 py-3 flex items-center justify-between ${statusConf.color}`}>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-5 h-5" />
                            <span className="font-bold">{order.order_number}</span>
                          </div>
                          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/50">{statusConf.label}</span>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="space-y-2">
                            {orderItems.length > 0 ? orderItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-gray-800">{item.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900">₺{(item.total_price || item.quantity * item.price!).toLocaleString()}</span>
                              </div>
                            )) : (
                              <p className="text-sm text-gray-500 italic">Ürün detayı yok</p>
                            )}
                          </div>
                          <div className="mt-4 pt-3 border-t-2 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="text-right">
                              {orderPaid > 0 && <span className="text-sm text-green-600 mr-2">-₺{orderPaid.toLocaleString()}</span>}
                              <span className="font-bold text-lg">₺{orderRemaining.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Henüz sipariş verilmedi</p>
                  <a href="/waiter" className="mt-3 inline-flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700">
                    Sipariş için Garson Paneline git
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Clear Table */}
              <button
                onClick={onClearTable}
                className="w-full py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50"
              >
                Masayı Kapat / Temizle
              </button>
            </div>
          ) : (
            // Empty Table
            <div className="text-center py-8">
              <Armchair className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-6">Bu masa boş</p>

              {!showSeatForm ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowSeatForm(true)}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 flex items-center gap-2 mx-auto"
                  >
                    <Users className="w-5 h-5" />
                    Müşteri Oturt
                  </button>
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">veya durum değiştir:</p>
                    <div className="flex items-center justify-center gap-3">
                      {(['available', 'reserved', 'cleaning'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => onStatusChange(status)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                            table.status === status ? statusConfig[status].color + ' ring-2 ring-offset-2' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-sm mx-auto space-y-5 text-left">
                  <h3 className="font-bold text-center">Müşteri Bilgileri</h3>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Kişi Sayısı *</label>
                    <div className="flex items-center gap-4 justify-center">
                      <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-14 h-14 bg-gray-100 rounded-xl font-bold text-2xl border-2">−</button>
                      <span className="text-4xl font-bold w-20 text-center">{guestCount}</span>
                      <button onClick={() => setGuestCount(Math.min(table.capacity, guestCount + 1))} className="w-14 h-14 bg-gray-100 rounded-xl font-bold text-2xl border-2">+</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Kapasite: {table.capacity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Müşteri Adı (Opsiyonel)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Örn: Ali Yılmaz"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowSeatForm(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold">İptal</button>
                    <button onClick={() => { onSeatTable(guestCount, customerName || undefined); setShowSeatForm(false); }} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold">Oturt</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Table Add/Edit Modal
function TableModal({ table, onSave, onClose }: { table: TableData | null; onSave: (data: any) => void; onClose: () => void; }) {
  const [formData, setFormData] = useState({
    number: table?.number || '',
    capacity: table?.capacity || 4,
    section: table?.section || 'İç Mekan',
    shape: table?.shape || 'square'
  });

  const sections = ['İç Mekan', 'Bahçe', 'Teras', 'VIP', 'Bar'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b-2 flex items-center justify-between">
          <h2 className="text-xl font-bold">{table ? 'Masa Düzenle' : 'Yeni Masa'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Masa No</label>
              <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full px-4 py-3 border-2 rounded-xl" placeholder="1, VIP1..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Kapasite</label>
              <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 border-2 rounded-xl" min={1} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Bölüm</label>
            <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="w-full px-4 py-3 border-2 rounded-xl">
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Şekil</label>
            <div className="flex gap-3">
              {(['square', 'round', 'rectangle'] as const).map(shape => {
                const Icon = shapeIcons[shape];
                return (
                  <button key={shape} type="button" onClick={() => setFormData({ ...formData, shape })} className={`flex-1 p-4 rounded-xl border-2 ${formData.shape === shape ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                    <Icon className={`w-7 h-7 mx-auto ${formData.shape === shape ? 'text-orange-600' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 border-t-2 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 rounded-xl font-semibold">İptal</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Kaydet</button>
        </div>
      </div>
    </div>
  );
}