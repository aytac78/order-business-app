'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  CreditCard,
  ShoppingBag,
  UserCircle,
  Timer,
  Printer,
  Banknote,
  QrCode,
  FileText,
  Building2,
  Check,
  ChevronRight,
  Percent
} from 'lucide-react';

interface OrderItem {
  id?: string;
  product_name?: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  total_price?: number;
  status?: string;
  notes?: string;
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
  waiter_id?: string;
  waiter_name?: string;
  customer_name?: string;
  guest_count?: number;
  notes?: string;
  paid_amount?: number;
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

interface InvoiceInfo {
  type: 'individual' | 'corporate';
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  tcNumber: string;
  address: string;
  email: string;
}

const statusConfig: Record<string, { label: string; color: string; cardBg: string }> = {
  available: { label: 'Boş', color: 'bg-green-100 border-green-400 text-green-800', cardBg: 'bg-green-50' },
  occupied: { label: 'Dolu', color: 'bg-red-100 border-red-400 text-red-800', cardBg: 'bg-red-50' },
  reserved: { label: 'Rezerve', color: 'bg-amber-100 border-amber-400 text-amber-800', cardBg: 'bg-amber-50' },
  cleaning: { label: 'Temizleniyor', color: 'bg-blue-100 border-blue-400 text-blue-800', cardBg: 'bg-blue-50' },
};

const orderStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  preparing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: ChefHat },
  ready: { label: 'Hazır', color: 'bg-green-100 text-green-800 border-green-300', icon: Bell },
  served: { label: 'Servis Edildi', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: CheckCircle },
};

const shapeIcons: Record<string, any> = {
  square: Square,
  round: CircleDot,
  rectangle: RectangleHorizontal,
};

// Items'ı parse et - her türlü formatı destekle
const parseItems = (items: any): OrderItem[] => {
  if (!items) return [];
  
  // Zaten array ise
  if (Array.isArray(items)) {
    return items.map(item => ({
      ...item,
      product_name: item.product_name || item.name || 'Ürün',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.price || 0,
      total_price: item.total_price || (item.quantity * (item.unit_price || item.price || 0))
    }));
  }
  
  // String ise JSON parse et
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return parseItems(parsed); // Recursive call
    } catch {
      return [];
    }
  }
  
  // Object ise (tek item)
  if (typeof items === 'object') {
    return [{
      ...items,
      product_name: items.product_name || items.name || 'Ürün',
      quantity: items.quantity || 1,
      unit_price: items.unit_price || items.price || 0,
      total_price: items.total_price || (items.quantity * (items.unit_price || items.price || 0))
    }];
  }
  
  return [];
};

// localStorage'dan ödenen miktarları al
const getPaidAmounts = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('order_paid_amounts') || '{}');
  } catch {
    return {};
  }
};

// localStorage'a ödenen miktarı kaydet
const savePaidAmount = (orderId: string, amount: number) => {
  if (typeof window === 'undefined') return;
  const paidAmounts = getPaidAmounts();
  paidAmounts[orderId] = (paidAmounts[orderId] || 0) + amount;
  localStorage.setItem('order_paid_amounts', JSON.stringify(paidAmounts));
};

// localStorage'dan ödenen miktarı sil
const clearPaidAmount = (orderId: string) => {
  if (typeof window === 'undefined') return;
  const paidAmounts = getPaidAmounts();
  delete paidAmounts[orderId];
  localStorage.setItem('order_paid_amounts', JSON.stringify(paidAmounts));
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
        setTables([]);
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

  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .not('table_number', 'is', null);
      setActiveOrders(ordersData || []);
    } catch (err) {
      console.error('Orders exception:', err);
    }
  }, [currentVenue?.id]);

  useEffect(() => {
    loadTables();
    fetchOrders();
  }, [loadTables, fetchOrders]);

  useEffect(() => {
    if (currentVenue?.id) {
      const channel = supabase
        .channel('tables-orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, () => fetchOrders())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, () => loadTables())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [currentVenue?.id, fetchOrders, loadTables]);

  const getTableOrders = (tableNumber: string) => activeOrders.filter(o => o.table_number === tableNumber);

  const addTable = async (tableData: any) => {
    if (!currentVenue?.id) return;
    const { error } = await supabase.from('tables').insert({ 
      venue_id: currentVenue.id, 
      table_number: tableData.number, 
      capacity: tableData.capacity, 
      section: tableData.section, 
      shape: tableData.shape, 
      status: 'available' 
    });
    if (!error) loadTables();
  };

  const updateTable = async (id: string, updates: any) => {
    const { error } = await supabase.from('tables').update(updates).eq('id', id);
    if (!error) loadTables();
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (!error) loadTables();
  };

  const seatTable = async (tableId: string, guestCount: number, customerName?: string) => {
    const { error } = await supabase.from('tables').update({ 
      status: 'occupied', 
      current_guests: guestCount, 
      customer_name: customerName || null, 
      seated_at: new Date().toISOString() 
    }).eq('id', tableId);
    if (!error) loadTables();
  };

  const clearTable = async (tableId: string) => {
    const { error } = await supabase.from('tables').update({ 
      status: 'cleaning', 
      current_guests: null, 
      customer_name: null, 
      seated_at: null 
    }).eq('id', tableId);
    if (!error) loadTables();
  };

  const sections = ['all', ...Array.from(new Set(tables.map(t => t.section)))];
  const filteredTables = selectedSection === 'all' ? tables : tables.filter(t => t.section === selectedSection);

  const getRealStatus = (table: TableData) => {
    const hasOrders = getTableOrders(table.number).length > 0;
    const hasGuests = table.current_guests && table.current_guests > 0;
    if (hasOrders || hasGuests) return 'occupied';
    if (table.status === 'reserved') return 'reserved';
    if (table.status === 'cleaning') return 'cleaning';
    return 'available';
  };

  const stats = {
    available: tables.filter(t => getRealStatus(t) === 'available').length,
    occupied: tables.filter(t => getRealStatus(t) === 'occupied').length,
    reserved: tables.filter(t => getRealStatus(t) === 'reserved').length,
    cleaning: tables.filter(t => getRealStatus(t) === 'cleaning').length,
  };

  const getSeatedDuration = (seatedAt: string | undefined) => {
    if (!seatedAt) return '-';
    const diff = Math.floor((new Date().getTime() - new Date(seatedAt).getTime()) / 60000);
    if (diff < 60) return `${diff} dk`;
    return `${Math.floor(diff / 60)} sa ${diff % 60} dk`;
  };

  const getSeatedTime = (seatedAt: string | undefined) => {
    if (!seatedAt) return '-';
    return new Date(seatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveTable = (tableData: any) => {
    if (editingTable) {
      updateTable(editingTable.id, { 
        table_number: tableData.number, 
        capacity: tableData.capacity, 
        section: tableData.section, 
        shape: tableData.shape, 
        status: tableData.status 
      });
    } else {
      addTable(tableData);
    }
    setShowAddModal(false);
    setEditingTable(null);
  };

  const handleDeleteTable = (id: string) => {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;
    deleteTable(id);
  };

  const handleTableClick = (table: TableData) => {
    setSelectedTable(table);
    setShowTableDetail(true);
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
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <p className="text-green-700 text-sm font-semibold">Boş</p>
          <p className="text-4xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
          <p className="text-red-700 text-sm font-semibold">Dolu</p>
          <p className="text-4xl font-bold text-red-600">{stats.occupied}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
          <p className="text-amber-700 text-sm font-semibold">Rezerve</p>
          <p className="text-4xl font-bold text-amber-600">{stats.reserved}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
          <p className="text-blue-700 text-sm font-semibold">Temizleniyor</p>
          <p className="text-4xl font-bold text-blue-600">{stats.cleaning}</p>
        </div>
      </div>

      {/* Section Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedSection === section
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {section === 'all' ? 'Tümü' : section} ({section === 'all' ? tables.length : tables.filter(t => t.section === section).length})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTables.map(table => {
          const tableOrders = getTableOrders(table.number);
          const hasOrder = tableOrders.length > 0;
          const hasReadyOrder = tableOrders.some(o => o.status === 'ready');
          
          // Kalan tutarı hesapla (ödenen miktarları çıkar)
          const paidAmounts = getPaidAmounts();
          const totalAmount = tableOrders.reduce((sum, o) => {
            const paid = paidAmounts[o.id] || 0;
            return sum + Math.max(0, (o.total || 0) - paid);
          }, 0);
          
          const ShapeIcon = shapeIcons[table.shape] || Square;
          const realStatus = getRealStatus(table);
          const config = statusConfig[realStatus] || statusConfig.available;
          const isOccupied = realStatus === 'occupied';

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${config.color} ${
                hasReadyOrder ? 'ring-4 ring-green-400 animate-pulse' : ''
              }`}
            >
              {hasReadyOrder && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <Bell className="w-4 h-4 text-white" />
                </div>
              )}
              
              {hasOrder && !hasReadyOrder && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">{tableOrders.length}</span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-2xl">{table.number}</h3>
                  <p className="text-xs font-medium opacity-70">{table.section}</p>
                </div>
                <ShapeIcon className="w-5 h-5 opacity-50" />
              </div>

              <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Users className="w-4 h-4" />
                <span>{table.capacity} kişilik</span>
              </div>

              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                isOccupied ? 'bg-red-200 text-red-800' : 
                realStatus === 'reserved' ? 'bg-amber-200 text-amber-800' :
                realStatus === 'cleaning' ? 'bg-blue-200 text-blue-800' :
                'bg-green-200 text-green-800'
              }`}>
                {hasReadyOrder ? '🔔 HAZIR!' : config.label}
              </div>

              {isOccupied && (
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
                      <span className="text-xs opacity-70">{tableOrders.length} sipariş</span>
                      <span className="font-bold">₺{totalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-current/10" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setEditingTable(table); setShowAddModal(true); }}
                  className="p-1.5 hover:bg-black/10 rounded transition-colors"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-1.5 hover:bg-red-200 rounded text-red-600 transition-colors"
                  title="Sil"
                >
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

      {showAddModal && (
        <TableModal
          table={editingTable}
          onSave={handleSaveTable}
          onClose={() => { setShowAddModal(false); setEditingTable(null); }}
        />
      )}

      {showTableDetail && selectedTable && (
        <TableDetailModal
          table={selectedTable}
          orders={getTableOrders(selectedTable.number)}
          onClose={() => { setShowTableDetail(false); setSelectedTable(null); }}
          onStatusChange={(status) => { 
            updateTable(selectedTable.id, { status }); 
            setSelectedTable({ ...selectedTable, status }); 
          }}
          onSeatTable={(guestCount, customerName) => { 
            seatTable(selectedTable.id, guestCount, customerName); 
            setSelectedTable({ 
              ...selectedTable, 
              status: 'occupied', 
              current_guests: guestCount, 
              customer_name: customerName, 
              seated_at: new Date().toISOString() 
            }); 
          }}
          onClearTable={() => { 
            clearTable(selectedTable.id); 
            setSelectedTable({ 
              ...selectedTable, 
              status: 'cleaning', 
              current_guests: undefined, 
              customer_name: undefined, 
              seated_at: undefined 
            }); 
          }}
          getSeatedDuration={getSeatedDuration}
          getSeatedTime={getSeatedTime}
          venueId={currentVenue.id}
          venueName={currentVenue.name}
          onOrderCreated={fetchOrders}
        />
      )}
    </div>
  );
}

// Table Detail Modal Component
function TableDetailModal({ 
  table, 
  orders, 
  onClose, 
  onStatusChange, 
  onSeatTable, 
  onClearTable, 
  getSeatedDuration, 
  getSeatedTime, 
  venueId,
  venueName,
  onOrderCreated 
}: { 
  table: TableData; 
  orders: ActiveOrder[]; 
  onClose: () => void; 
  onStatusChange: (status: string) => void; 
  onSeatTable: (guestCount: number, customerName?: string) => void; 
  onClearTable: () => void; 
  getSeatedDuration: (seatedAt: string | undefined) => string; 
  getSeatedTime: (seatedAt: string | undefined) => string; 
  venueId: string;
  venueName: string;
  onOrderCreated: () => void; 
}) {
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [, forceUpdate] = useState(0); // Force re-render after payment

  const hasOrders = orders.length > 0;
  // Sipariş varsa VEYA müşteri oturmuşsa dolu say
  const isOccupied = hasOrders || table.status === 'occupied' || (table.current_guests && table.current_guests > 0);
  
  // Kalan tutarı hesapla
  const paidAmounts = getPaidAmounts();
  const originalTotal = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (paidAmounts[o.id] || 0), 0);
  const totalAmount = Math.max(0, originalTotal - totalPaid);
  const subtotal = orders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
  const tax = originalTotal - subtotal;

  // Tüm sipariş itemlarını birleştir
  const allItems = orders.flatMap(o => parseItems(o.items));

  const ordersByStatus = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing' || o.status === 'confirmed'),
    ready: orders.filter(o => o.status === 'ready'),
    served: orders.filter(o => o.status === 'served'),
  };

  const handleSeatTable = () => { 
    onSeatTable(guestCount, customerName || undefined); 
    setShowSeatForm(false); 
  };

  const createDemoOrder = async () => {
    if (!isOccupied) onSeatTable(2, 'Demo Müşteri');
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from('orders').insert({ 
      venue_id: venueId, 
      table_number: table.number, 
      order_number: orderNumber, 
      type: 'dine_in', 
      status: 'preparing', 
      items: [
        { product_name: 'Izgara Levrek', quantity: 2, unit_price: 320, total_price: 640 }, 
        { product_name: 'Caesar Salata', quantity: 1, unit_price: 120, total_price: 120 }, 
        { product_name: 'Limonata', quantity: 2, unit_price: 45, total_price: 90 }
      ], 
      subtotal: 850, 
      tax: 68, 
      service_charge: 85, 
      discount: 0, 
      total: 1003, 
      payment_status: 'pending' 
    });
    if (!error) onOrderCreated();
    else alert('Sipariş oluşturulurken hata: ' + error.message);
  };

  const handlePaymentComplete = async (paidAmount: number, isFullPayment: boolean) => {
    if (isFullPayment) {
      // Tam ödeme - siparişleri kapat ve localStorage'ı temizle
      for (const order of orders) {
        await supabase.from('orders').update({ 
          status: 'completed', 
          payment_status: 'paid' 
        }).eq('id', order.id);
        clearPaidAmount(order.id);
      }
      onClearTable();
      setShowPaymentModal(false);
      onClose();
    } else {
      // Kısmi ödeme - localStorage'a kaydet
      // Ödemeyi ilk siparişe uygula
      if (orders.length > 0) {
        savePaidAmount(orders[0].id, paidAmount);
      }
      setShowPaymentModal(false);
      forceUpdate(n => n + 1); // Re-render to show updated amount
      alert(`₺${paidAmount.toLocaleString()} ödeme alındı.\nKalan: ₺${(totalAmount - paidAmount).toLocaleString()}`);
    }
  };

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
              <p className="text-sm text-gray-600 font-medium">{table.section} • {table.capacity} kişilik kapasite</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
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
                    <p className="text-xl font-bold text-gray-800">{table.current_guests || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Oturma Saati</p>
                    <p className="text-xl font-bold text-gray-800">{getSeatedTime(table.seated_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Geçen Süre</p>
                    <p className="text-xl font-bold text-gray-800">{getSeatedDuration(table.seated_at)}</p>
                  </div>
                </div>
                {table.customer_name && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Müşteri</p>
                    <p className="text-lg font-semibold text-gray-800">{table.customer_name}</p>
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
                  <CreditCard className="w-7 h-7 mx-auto mb-2 text-green-600" />
                  <p className="text-3xl font-bold text-green-700">₺{totalAmount.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-green-600">
                    {totalPaid > 0 ? 'Kalan' : 'Toplam'}
                  </p>
                </div>
              </div>

              {/* Paid Amount Info */}
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

              {/* Order Status Summary */}
              {hasOrders && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-amber-100 rounded-xl p-3 text-center border-2 border-amber-300">
                    <p className="text-2xl font-bold text-amber-700">{ordersByStatus.pending.length}</p>
                    <p className="text-xs font-semibold text-amber-600">Bekliyor</p>
                  </div>
                  <div className="bg-purple-100 rounded-xl p-3 text-center border-2 border-purple-300">
                    <p className="text-2xl font-bold text-purple-700">{ordersByStatus.preparing.length}</p>
                    <p className="text-xs font-semibold text-purple-600">Hazırlanıyor</p>
                  </div>
                  <div className="bg-green-100 rounded-xl p-3 text-center border-2 border-green-300">
                    <p className="text-2xl font-bold text-green-700">{ordersByStatus.ready.length}</p>
                    <p className="text-xs font-semibold text-green-600">Hazır</p>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-3 text-center border-2 border-gray-300">
                    <p className="text-2xl font-bold text-gray-700">{ordersByStatus.served.length}</p>
                    <p className="text-xs font-semibold text-gray-600">Servis Edildi</p>
                  </div>
                </div>
              )}

              {/* Orders List */}
              {hasOrders ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Siparişler</h3>
                  {orders.map(order => {
                    const statusConf = orderStatusConfig[order.status] || orderStatusConfig.pending;
                    const StatusIcon = statusConf.icon;
                    const orderItems = parseItems(order.items);
                    const orderPaid = paidAmounts[order.id] || 0;
                    const orderRemaining = Math.max(0, (order.total || 0) - orderPaid);
                    
                    return (
                      <div key={order.id} className="border-2 rounded-xl overflow-hidden shadow-sm">
                        <div className={`px-4 py-3 flex items-center justify-between ${statusConf.color} border-b-2`}>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="w-5 h-5" />
                            <span className="font-bold">{order.order_number}</span>
                          </div>
                          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-white/50">{statusConf.label}</span>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="space-y-2">
                            {orderItems.length > 0 ? orderItems.map((item: OrderItem, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-700">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-gray-800">{item.product_name || item.name || 'Ürün'}</span>
                                </div>
                                <span className="font-semibold text-gray-700">₺{(item.total_price || (item.quantity * (item.unit_price || item.price || 0))).toLocaleString()}</span>
                              </div>
                            )) : (
                              <p className="text-sm text-gray-500 italic">Ürün detayı yok</p>
                            )}
                          </div>
                          <div className="mt-4 pt-3 border-t-2 flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-medium">
                              {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="text-right">
                              {orderPaid > 0 && (
                                <span className="text-sm text-green-600 mr-2">-₺{orderPaid.toLocaleString()}</span>
                              )}
                              <span className="font-bold text-lg text-gray-900">₺{orderRemaining.toLocaleString()}</span>
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
                  <button 
                    onClick={createDemoOrder} 
                    className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                  >
                    Demo Sipariş Ekle
                  </button>
                </div>
              )}

              {/* Close Table Button */}
              <button 
                onClick={onClearTable} 
                className="w-full py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
              >
                Masayı Kapat / Temizle
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Armchair className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-6">Bu masa boş</p>
              
              {!showSeatForm ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowSeatForm(true)} 
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Users className="w-5 h-5" />
                    Müşteri Oturt
                  </button>
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium mb-3">veya durum değiştir:</p>
                    <div className="flex items-center justify-center gap-3">
                      {(['available', 'reserved', 'cleaning'] as const).map(status => {
                        const conf = statusConfig[status];
                        const isActive = table.status === status;
                        return (
                          <button 
                            key={status} 
                            onClick={() => onStatusChange(status)} 
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                              isActive ? conf.color + ' ring-2 ring-offset-2 ring-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {conf.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-sm mx-auto space-y-5 text-left">
                  <h3 className="font-bold text-gray-800 text-center">Müşteri Bilgileri</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kişi Sayısı *</label>
                    <div className="flex items-center gap-4 justify-center">
                      <button 
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))} 
                        className="w-14 h-14 bg-gray-100 rounded-xl font-bold text-2xl text-gray-700 hover:bg-gray-200 transition-colors border-2 border-gray-300 flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-4xl font-bold w-20 text-center text-gray-900">{guestCount}</span>
                      <button 
                        onClick={() => setGuestCount(Math.min(table.capacity, guestCount + 1))} 
                        className="w-14 h-14 bg-gray-100 rounded-xl font-bold text-2xl text-gray-700 hover:bg-gray-200 transition-colors border-2 border-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Kapasite: {table.capacity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Müşteri Adı (Opsiyonel)</label>
                    <input 
                      type="text" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      placeholder="Örn: Ali Yılmaz" 
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setShowSeatForm(false)} 
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      İptal
                    </button>
                    <button 
                      onClick={handleSeatTable} 
                      className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-md"
                    >
                      Oturt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isOccupied && hasOrders && (
          <div className="p-5 border-t-2 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                {totalPaid > 0 ? 'Kalan Tutar' : 'Toplam Tutar'}
              </p>
              <p className="text-3xl font-bold text-gray-900">₺{totalAmount.toLocaleString()}</p>
              {totalPaid > 0 && (
                <p className="text-xs text-green-600">₺{totalPaid.toLocaleString()} ödendi</p>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPrintPreview(true)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl hover:bg-white font-semibold transition-colors text-gray-700 flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Hesap Yazdır
              </button>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold flex items-center gap-2 transition-colors shadow-md"
              >
                <CreditCard className="w-5 h-5" />
                Ödeme Al
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          tableNumber={table.number}
          totalAmount={totalAmount}
          originalTotal={originalTotal}
          totalPaid={totalPaid}
          subtotal={subtotal}
          tax={tax}
          items={allItems}
          venueName={venueName}
          customerName={table.customer_name}
          guestCount={table.current_guests || 1}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <PrintPreviewModal
          tableNumber={table.number}
          totalAmount={totalAmount}
          originalTotal={originalTotal}
          totalPaid={totalPaid}
          subtotal={subtotal}
          tax={tax}
          items={allItems}
          venueName={venueName}
          customerName={table.customer_name}
          seatedAt={table.seated_at}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
}

// Payment Modal Component
function PaymentModal({
  tableNumber,
  totalAmount,
  originalTotal,
  totalPaid,
  subtotal,
  tax,
  items,
  venueName,
  customerName,
  guestCount,
  onClose,
  onPaymentComplete
}: {
  tableNumber: string;
  totalAmount: number;
  originalTotal: number;
  totalPaid: number;
  subtotal: number;
  tax: number;
  items: OrderItem[];
  venueName: string;
  customerName?: string;
  guestCount: number;
  onClose: () => void;
  onPaymentComplete: (paidAmount: number, isFullPayment: boolean) => void;
}) {
  const [step, setStep] = useState<'method' | 'document' | 'invoice' | 'complete'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'titpay' | null>(null);
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial' | 'split'>('full');
  const [documentType, setDocumentType] = useState<'receipt' | 'invoice' | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [splitCount, setSplitCount] = useState(guestCount || 2);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState<InvoiceInfo>({
    type: 'corporate',
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    tcNumber: '',
    address: '',
    email: ''
  });

  // Hesaplamalar
  const discountAmount = discountType === 'percent' ? (totalAmount * discount / 100) : discount;
  const finalTotal = Math.max(0, totalAmount - discountAmount);
  const change = parseFloat(cashReceived) - finalTotal;
  const splitAmount = Math.ceil(finalTotal / splitCount);
  const partialValue = parseFloat(partialAmount) || 0;

  const handlePaymentMethodSelect = (method: 'cash' | 'card' | 'titpay') => {
    setPaymentMethod(method);
    setStep('document');
  };

  const handleDocumentSelect = (type: 'receipt' | 'invoice') => {
    setDocumentType(type);
    if (type === 'invoice') {
      setStep('invoice');
    } else {
      setStep('complete');
    }
  };

  const handleInvoiceSubmit = () => {
    if (invoiceInfo.type === 'corporate') {
      if (!invoiceInfo.companyName || !invoiceInfo.taxOffice || !invoiceInfo.taxNumber) {
        alert('Lütfen şirket bilgilerini eksiksiz doldurun');
        return;
      }
      if (invoiceInfo.taxNumber.length !== 10) {
        alert('Vergi numarası 10 haneli olmalıdır');
        return;
      }
    } else {
      if (!invoiceInfo.tcNumber) {
        alert('Lütfen TC Kimlik No girin');
        return;
      }
      if (invoiceInfo.tcNumber.length !== 11) {
        alert('TC Kimlik No 11 haneli olmalıdır');
        return;
      }
    }
    setStep('complete');
  };

  const getPayAmount = () => {
    if (paymentMode === 'partial') return partialValue;
    if (paymentMode === 'split') return splitAmount;
    return finalTotal;
  };

  const isFullPayment = () => {
    const payAmount = getPayAmount();
    return payAmount >= finalTotal;
  };

  const canPay = () => {
    if (paymentMode === 'partial') return partialValue > 0 && partialValue <= finalTotal;
    if (paymentMode === 'split') return splitCount >= 2;
    if (paymentMethod === 'cash') return parseFloat(cashReceived) >= finalTotal;
    return true;
  };

  const handleFinalPayment = () => {
    const payAmount = getPayAmount();
    onPaymentComplete(payAmount, isFullPayment());
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b-2 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ödeme Al</h2>
            <p className="text-sm text-gray-600">
              Masa {tableNumber} • ₺{finalTotal.toLocaleString()}
              {totalPaid > 0 && <span className="text-green-600"> (₺{totalPaid} ödendi)</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Payment Method */}
          {step === 'method' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg text-center mb-4">Ödeme Yöntemi</h3>
              
              {/* Payment Mode Tabs */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
                <button
                  onClick={() => setPaymentMode('full')}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    paymentMode === 'full' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Tam Ödeme
                </button>
                <button
                  onClick={() => setPaymentMode('partial')}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    paymentMode === 'partial' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Kısmi
                </button>
                <button
                  onClick={() => setPaymentMode('split')}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    paymentMode === 'split' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Böl
                </button>
              </div>

              {/* Partial Amount Input */}
              {paymentMode === 'partial' && (
                <div className="mb-4 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ödenecek Tutar</label>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="0"
                    max={finalTotal}
                    className="w-full text-2xl font-bold text-center py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:border-orange-500 outline-none"
                  />
                  <div className="flex gap-2 mt-3">
                    {[25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => setPartialAmount(Math.round(finalTotal * p / 100).toString())}
                        className="flex-1 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-semibold text-orange-700"
                      >
                        %{p}
                      </button>
                    ))}
                  </div>
                  {partialValue > 0 && (
                    <p className="text-sm text-orange-600 mt-2 text-center">
                      Kalan: ₺{(finalTotal - partialValue).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Split Options */}
              {paymentMode === 'split' && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">Kişi Sayısı</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                      className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl font-bold text-xl hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="text-4xl font-bold w-16 text-center text-gray-900">{splitCount}</span>
                    <button
                      onClick={() => setSplitCount(Math.min(20, splitCount + 1))}
                      className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl font-bold text-xl hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg text-center">
                    <p className="text-sm text-blue-600">Kişi Başı</p>
                    <p className="text-2xl font-bold text-blue-700">₺{splitAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Discount */}
              {!showDiscountInput ? (
                <button
                  onClick={() => setShowDiscountInput(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 flex items-center justify-center gap-2"
                >
                  <Percent className="w-4 h-4" />
                  İndirim Uygula
                </button>
              ) : (
                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">İndirim</span>
                    <button onClick={() => { setShowDiscountInput(false); setDiscount(0); }} className="text-red-500 text-sm">
                      Kaldır
                    </button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setDiscountType('percent')}
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm ${discountType === 'percent' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                    >
                      Yüzde (%)
                    </button>
                    <button
                      onClick={() => setDiscountType('amount')}
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm ${discountType === 'amount' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
                    >
                      Tutar (₺)
                    </button>
                  </div>
                  <input
                    type="number"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-xl font-bold text-center py-2 border-2 border-gray-300 rounded-xl bg-white text-gray-900"
                  />
                  {discount > 0 && (
                    <p className="text-sm text-green-600 mt-2 text-center">
                      İndirim: -₺{discountAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-2 mt-4">
                <button
                  onClick={() => handlePaymentMethodSelect('cash')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">Nakit</p>
                    <p className="text-sm text-gray-500">Nakit ödeme al</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button
                  onClick={() => handlePaymentMethodSelect('card')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">Kredi / Banka Kartı</p>
                    <p className="text-sm text-gray-500">POS ile ödeme</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button
                  onClick={() => handlePaymentMethodSelect('titpay')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">TiT Pay</p>
                    <p className="text-sm text-gray-500">QR kod ile ödeme</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Total */}
              <div className="mt-4 p-4 bg-gray-100 rounded-xl">
                {totalPaid > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Orijinal Tutar</span>
                    <span>₺{originalTotal.toLocaleString()}</span>
                  </div>
                )}
                {totalPaid > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Önceki Ödemeler</span>
                    <span>-₺{totalPaid.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>İndirim</span>
                    <span>-₺{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Ödenecek</span>
                  <span>₺{getPayAmount().toLocaleString()}</span>
                </div>
                {paymentMode === 'partial' && partialValue > 0 && partialValue < finalTotal && (
                  <div className="flex justify-between text-sm text-orange-600 mt-1">
                    <span>Kalan</span>
                    <span>₺{(finalTotal - partialValue).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Document Type */}
          {step === 'document' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('method')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
              >
                ← Geri
              </button>
              
              <h3 className="font-bold text-gray-800 text-lg text-center mb-4">Belge Türü</h3>

              {/* Cash input */}
              {paymentMethod === 'cash' && paymentMode === 'full' && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alınan Tutar</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="w-full text-2xl font-bold text-center py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:border-green-500 outline-none"
                  />
                  <div className="flex gap-2 mt-3">
                    {[50, 100, 200, 500, 1000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setCashReceived(amount.toString())}
                        className="flex-1 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-semibold text-green-700"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                  {parseFloat(cashReceived) >= finalTotal && (
                    <div className="mt-3 p-3 bg-green-100 rounded-lg text-center">
                      <p className="text-sm text-green-600">Para Üstü</p>
                      <p className="text-2xl font-bold text-green-700">₺{change.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TiT Pay QR */}
              {paymentMethod === 'titpay' && (
                <div className="mb-4 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl text-center border-2 border-purple-200">
                  <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                    <QrCode className="w-24 h-24 text-purple-600" />
                  </div>
                  <p className="font-semibold text-purple-800">TiT Pay ile Ödeme</p>
                  <p className="text-sm text-purple-600">QR kodu müşteriye gösterin</p>
                </div>
              )}
              
              <button
                onClick={() => handleDocumentSelect('receipt')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">Fiş</p>
                  <p className="text-sm text-gray-500">Standart satış fişi</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleDocumentSelect('invoice')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">Fatura</p>
                  <p className="text-sm text-gray-500">Kurumsal veya bireysel fatura</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Step 3: Invoice Info */}
          {step === 'invoice' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('document')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
              >
                ← Geri
              </button>
              
              <h3 className="font-bold text-gray-800 text-lg text-center mb-4">Fatura Bilgileri</h3>

              {/* Invoice Type Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
                <button
                  onClick={() => setInvoiceInfo({ ...invoiceInfo, type: 'corporate' })}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    invoiceInfo.type === 'corporate' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Kurumsal
                </button>
                <button
                  onClick={() => setInvoiceInfo({ ...invoiceInfo, type: 'individual' })}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    invoiceInfo.type === 'individual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  Bireysel
                </button>
              </div>

              {invoiceInfo.type === 'corporate' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Şirket / Firma Adı *</label>
                    <input
                      type="text"
                      value={invoiceInfo.companyName}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, companyName: e.target.value })}
                      placeholder="ABC Teknoloji A.Ş."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi Dairesi *</label>
                      <input
                        type="text"
                        value={invoiceInfo.taxOffice}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxOffice: e.target.value })}
                        placeholder="Kadıköy"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi No *</label>
                      <input
                        type="text"
                        value={invoiceInfo.taxNumber}
                        onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="1234567890"
                        maxLength={10}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{invoiceInfo.taxNumber?.length || 0}/10</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">TC Kimlik No *</label>
                    <input
                      type="text"
                      value={invoiceInfo.tcNumber}
                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, tcNumber: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      placeholder="12345678901"
                      maxLength={11}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{invoiceInfo.tcNumber?.length || 0}/11</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleInvoiceSubmit}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors mt-4"
              >
                Devam Et
              </button>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ödeme Hazır</h3>
              <p className="text-gray-600 mb-6">
                {paymentMethod === 'cash' && 'Nakit ödeme alındı'}
                {paymentMethod === 'card' && 'Kart ile ödeme alınacak'}
                {paymentMethod === 'titpay' && 'TiT Pay ödemesi onaylandı'}
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Ödeme Yöntemi</span>
                  <span className="font-semibold">
                    {paymentMethod === 'cash' && 'Nakit'}
                    {paymentMethod === 'card' && 'Kredi/Banka Kartı'}
                    {paymentMethod === 'titpay' && 'TiT Pay'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Belge Türü</span>
                  <span className="font-semibold">{documentType === 'receipt' ? 'Fiş' : 'Fatura'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Ödeme Tipi</span>
                  <span className="font-semibold">
                    {paymentMode === 'full' && 'Tam Ödeme'}
                    {paymentMode === 'partial' && 'Kısmi Ödeme'}
                    {paymentMode === 'split' && `Bölünmüş (${splitCount} kişi)`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 mt-2">
                  <span>Alınacak Tutar</span>
                  <span className="text-green-600">₺{getPayAmount().toLocaleString()}</span>
                </div>
                {!isFullPayment() && (
                  <div className="flex justify-between text-sm text-orange-600 mt-1">
                    <span>Kalan Tutar</span>
                    <span>₺{(finalTotal - getPayAmount()).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleFinalPayment}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isFullPayment() ? 'Ödemeyi Tamamla' : 'Kısmi Ödemeyi Al'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Print Preview Modal Component
function PrintPreviewModal({
  tableNumber,
  totalAmount,
  originalTotal,
  totalPaid,
  subtotal,
  tax,
  items,
  venueName,
  customerName,
  seatedAt,
  onClose
}: {
  tableNumber: string;
  totalAmount: number;
  originalTotal: number;
  totalPaid: number;
  subtotal: number;
  tax: number;
  items: OrderItem[];
  venueName: string;
  customerName?: string;
  seatedAt?: string;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hesap - Masa ${tableNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 18px; margin: 0 0 5px 0; }
            .header p { margin: 2px 0; font-size: 12px; }
            .items { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const now = new Date();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Hesap Önizleme</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Print Preview Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div ref={printRef} className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl font-mono text-sm">
            {/* Receipt Header */}
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
              <h1 className="text-lg font-bold">{venueName}</h1>
              <p className="text-xs text-gray-600">Masa: {tableNumber}</p>
              {customerName && <p className="text-xs text-gray-600">Müşteri: {customerName}</p>}
              <p className="text-xs text-gray-600">{now.toLocaleDateString('tr-TR')} {now.toLocaleTimeString('tr-TR')}</p>
            </div>

            {/* Items */}
            <div className="border-b-2 border-dashed border-gray-400 pb-3 mb-3">
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const itemName = item.product_name || item.name || 'Ürün';
                  const itemTotal = item.total_price || (item.quantity * (item.unit_price || item.price || 0));
                  return (
                    <div key={idx} className="flex justify-between py-1">
                      <span className="flex-1">{item.quantity}x {itemName}</span>
                      <span className="font-semibold">₺{itemTotal.toLocaleString()}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500">Ürün bulunamadı</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span>₺{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV:</span>
                <span>₺{tax.toLocaleString()}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between border-t border-gray-300 pt-1">
                    <span>Toplam:</span>
                    <span>₺{originalTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Ödenen:</span>
                    <span>-₺{totalPaid.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-400 pt-2 mt-2">
                <span>{totalPaid > 0 ? 'KALAN:' : 'TOPLAM:'}</span>
                <span>₺{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-3 border-t-2 border-dashed border-gray-400 text-xs text-gray-500">
              <p>Bizi tercih ettiğiniz için teşekkürler!</p>
              <p>www.orderapp.com</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t-2 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Kapat
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Yazdır
          </button>
        </div>
      </div>
    </div>
  );
}

// Table Add/Edit Modal Component
function TableModal({ 
  table, 
  onSave, 
  onClose 
}: { 
  table: TableData | null; 
  onSave: (data: any) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({ 
    number: table?.number || '', 
    capacity: table?.capacity || 4, 
    section: table?.section || 'İç Mekan', 
    shape: table?.shape || 'square', 
    status: table?.status || 'available' 
  });
  
  const sections = ['İç Mekan', 'Bahçe', 'Teras', 'VIP', 'Bar'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{table ? 'Masa Düzenle' : 'Yeni Masa'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Masa No</label>
              <input 
                type="text" 
                value={formData.number} 
                onChange={(e) => setFormData({ ...formData, number: e.target.value })} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium outline-none transition-colors" 
                placeholder="1, 2, VIP1..." 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kapasite</label>
              <input 
                type="number" 
                value={formData.capacity} 
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} 
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium outline-none transition-colors" 
                min={1} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bölüm</label>
            <select 
              value={formData.section} 
              onChange={(e) => setFormData({ ...formData, section: e.target.value })} 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium outline-none transition-colors"
            >
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Şekil</label>
            <div className="flex gap-3">
              {(['square', 'round', 'rectangle'] as const).map(shape => {
                const Icon = shapeIcons[shape];
                return (
                  <button 
                    key={shape} 
                    type="button" 
                    onClick={() => setFormData({ ...formData, shape })} 
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      formData.shape === shape ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-7 h-7 mx-auto ${formData.shape === shape ? 'text-orange-600' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t-2 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors text-gray-700"
          >
            İptal
          </button>
          <button 
            onClick={() => onSave(formData)} 
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold transition-colors shadow-md"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}