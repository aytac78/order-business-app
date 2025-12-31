'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Clock,
  Bell,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  X,
  Search,
  Volume2,
  VolumeX,
  RefreshCw,
  ShoppingCart,
  Send,
  CreditCard,
  UserPlus,
  Phone,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Utensils,
  Coffee
} from 'lucide-react';

// =============================================
// TYPE DEFINITIONS - Supabase Şemasına Uygun
// =============================================
interface TableData {
  id: string;
  venue_id: string;
  number: string;
  name: string | null;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  shape: string;
  position_x: number;
  position_y: number;
  qr_code: string;
  is_active: boolean;
  created_at: string;
  current_guests: number;
  customer_name: string | null;
  seated_at: string | null;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes: string;
  status: string;
}

interface Order {
  id: string;
  venue_id: string;
  table_id: string | null;
  table_number: string;
  order_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: OrderItem[];
}

interface Reservation {
  id: string;
  venue_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  date: string;
  time: string;
  party_size: number;
  table_number: string | null;
  status: string;
  notes: string | null;
  special_requests: string | null;
  created_at: string;
}

interface WaiterCall {
  id: string;
  venue_id: string;
  table_id: string;
  type: string;
  status: string;
  created_at: string;
}

interface Product {
  id: string;
  venue_id: string;
  category_id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
}

interface Category {
  id: string;
  venue_id: string;
  name: string;
  sort_order: number;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  // "14:30:00" -> "14:30"
  return timeStr.substring(0, 5);
};

const formatDateTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) return '₺0';
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const generateOrderNumber = (): string => {
  return `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// =============================================
// STATUS CONFIGS
// =============================================
const tableStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Müsait', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/50' },
  occupied: { label: 'Dolu', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/50' },
  reserved: { label: 'Rezerve', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/50' },
  cleaning: { label: 'Temizleniyor', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/50' },
};

const orderStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Bekliyor', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  confirmed: { label: 'Onaylandı', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  preparing: { label: 'Hazırlanıyor', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  ready: { label: 'Hazır', color: 'text-green-400', bg: 'bg-green-500/20' },
  served: { label: 'Servis Edildi', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  completed: { label: 'Tamamlandı', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  cancelled: { label: 'İptal', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const waiterCallTypes: Record<string, string> = {
  waiter: '🙋 Garson Çağrısı',
  bill: '💳 Hesap İsteniyor',
  help: '❓ Yardım',
};

// =============================================
// MAIN COMPONENT
// =============================================
export default function WaiterPage() {
  const { currentVenue } = useVenueStore();
  
  // Data states
  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI states
  const [selectedSection, setSelectedSection] = useState<string>('Tümü');
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Cleaning timer refs
  const cleaningTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // =============================================
  // DATA LOADING FUNCTIONS
  // =============================================
  const loadTables = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_active', true)
      .order('number');
    
    if (error) {
      console.error('Tables load error:', error);
      return;
    }
    
    if (data) setTables(data);
  }, [currentVenue?.id]);

  const loadOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Orders load error:', error);
      return;
    }
    
    if (data) setOrders(data);
  }, [currentVenue?.id]);

  const loadReservations = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('date', today)
      .in('status', ['pending', 'confirmed'])
      .order('time');
    
    if (error) {
      console.error('Reservations load error:', error);
      return;
    }
    
    if (data) setReservations(data);
  }, [currentVenue?.id]);

  const loadWaiterCalls = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data, error } = await supabase
      .from('waiter_calls')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Waiter calls load error:', error);
      return;
    }
    
    if (data) setWaiterCalls(data);
  }, [currentVenue?.id]);

  const loadProducts = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_available', true)
      .order('name');
    
    if (error) {
      console.error('Products load error:', error);
      return;
    }
    
    if (data) setProducts(data);
  }, [currentVenue?.id]);

  const loadCategories = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('sort_order');
    
    if (error) {
      console.error('Categories load error:', error);
      return;
    }
    
    if (data) setCategories(data);
  }, [currentVenue?.id]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadTables(),
      loadOrders(),
      loadReservations(),
      loadWaiterCalls(),
      loadProducts(),
      loadCategories(),
    ]);
    setLoading(false);
  }, [loadTables, loadOrders, loadReservations, loadWaiterCalls, loadProducts, loadCategories]);

  // =============================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel(`waiter-panel-${currentVenue.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
        (payload) => {
          console.log('Order change:', payload);
          loadOrders();
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playSound();
          }
          if (payload.eventType === 'UPDATE' && (payload.new as Order).status === 'ready' && soundEnabled) {
            playSound();
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` },
        () => {
          console.log('Table change');
          loadTables();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` },
        () => {
          console.log('Reservation change');
          loadReservations();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'waiter_calls', filter: `venue_id=eq.${currentVenue.id}` },
        (payload) => {
          console.log('Waiter call:', payload);
          loadWaiterCalls();
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenue?.id, loadOrders, loadTables, loadReservations, loadWaiterCalls, soundEnabled]);

  // Initial data load
  useEffect(() => {
    if (currentVenue?.id) {
      loadAllData();
    }
  }, [currentVenue?.id, loadAllData]);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // =============================================
  // CLEANING TIMER - 5 dakika sonra otomatik müsait
  // =============================================
  useEffect(() => {
    tables.forEach(table => {
      if (table.status === 'cleaning' && !cleaningTimers.current.has(table.id)) {
        const timer = setTimeout(async () => {
          await supabase
            .from('tables')
            .update({ 
              status: 'available', 
              current_guests: 0, 
              customer_name: null,
              seated_at: null 
            })
            .eq('id', table.id);
          cleaningTimers.current.delete(table.id);
          loadTables();
        }, 5 * 60 * 1000); // 5 dakika
        
        cleaningTimers.current.set(table.id, timer);
      } else if (table.status !== 'cleaning' && cleaningTimers.current.has(table.id)) {
        clearTimeout(cleaningTimers.current.get(table.id));
        cleaningTimers.current.delete(table.id);
      }
    });

    return () => {
      cleaningTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [tables, loadTables]);

  // =============================================
  // SOUND
  // =============================================
  const playSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  // =============================================
  // COMPUTED VALUES
  // =============================================
  const sections = ['Tümü', ...Array.from(new Set(tables.map(t => t.section).filter(Boolean)))];
  
  const filteredTables = selectedSection === 'Tümü' 
    ? tables 
    : tables.filter(t => t.section === selectedSection);

  const getTableOrders = (tableNumber: string): Order[] => 
    orders.filter(o => o.table_number === tableNumber && !['completed', 'cancelled'].includes(o.status));

  const getTableReservation = (tableNumber: string): Reservation | undefined =>
    reservations.find(r => r.table_number === tableNumber);

  // Gerçek masa durumunu hesapla
  const getEffectiveStatus = (table: TableData): string => {
    // Müşteri adı veya kişi sayısı varsa DOLU kabul et
    if (table.customer_name || (table.current_guests && table.current_guests > 0)) {
      return 'occupied';
    }
    // Aktif sipariş varsa DOLU
    const tableOrders = getTableOrders(table.number);
    if (tableOrders.length > 0) {
      return 'occupied';
    }
    return table.status;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // =============================================
  // ACTIONS
  // =============================================
  const updateTableStatus = async (tableId: string, newStatus: string) => {
    const updateData: Partial<TableData> = { status: newStatus as TableData['status'] };
    
    // Müsait yapılırsa müşteri bilgilerini temizle
    if (newStatus === 'available') {
      updateData.current_guests = 0;
      updateData.customer_name = null;
      updateData.seated_at = null;
    }
    
    const { error } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', tableId);
    
    if (error) {
      console.error('Table status update error:', error);
      alert('Masa durumu güncellenemedi');
      return;
    }
    
    loadTables();
    setSelectedTable(null);
  };

  const addGuestToTable = async (table: TableData) => {
    const newGuestCount = (table.current_guests || 0) + 1;
    
    const { error } = await supabase
      .from('tables')
      .update({ 
        current_guests: newGuestCount,
        status: 'occupied'
      })
      .eq('id', table.id);
    
    if (error) {
      console.error('Add guest error:', error);
      alert('Kişi eklenemedi');
      return;
    }
    
    loadTables();
    // Modal'ı güncelle
    setSelectedTable(prev => prev ? { ...prev, current_guests: newGuestCount, status: 'occupied' } : null);
  };

  const acknowledgeWaiterCall = async (callId: string) => {
    const { error } = await supabase
      .from('waiter_calls')
      .update({ 
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', callId);
    
    if (error) {
      console.error('Acknowledge call error:', error);
      return;
    }
    
    loadWaiterCalls();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('Order status update error:', error);
      alert('Sipariş durumu güncellenemedi');
      return;
    }
    
    loadOrders();
  };

  // =============================================
  // RENDER - Loading & No Venue States
  // =============================================
  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-400">Garson paneli için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-white text-xl">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // =============================================
  // RENDER - Main UI
  // =============================================
  return (
    <div className="min-h-screen bg-gray-900 text-white -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Garson Paneli</h1>
            <p className="text-gray-400 text-sm">
              {currentTime.toLocaleTimeString('tr-TR')} • {currentVenue.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Waiter Calls Alert */}
          {waiterCalls.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl animate-pulse">
              <Bell className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">{waiterCalls.length} Çağrı</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{pendingOrders.length}</p>
              <p className="text-xs text-gray-400">Yeni</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{preparingOrders.length}</p>
              <p className="text-xs text-gray-400">Hazırlanıyor</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{readyOrders.length}</p>
              <p className="text-xs text-gray-400">Hazır</p>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-colors ${
              soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Refresh */}
          <button
            onClick={loadAllData}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Waiter Calls Banner */}
      {waiterCalls.length > 0 && (
        <div className="mb-6 space-y-2">
          {waiterCalls.map(call => {
            const callTable = tables.find(t => t.id === call.table_id);
            return (
              <div key={call.id} className="flex items-center justify-between p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <Bell className="w-6 h-6 text-red-400 animate-bounce" />
                  <div>
                    <p className="font-medium">
                      Masa {callTable?.number || '?'} - {waiterCallTypes[call.type] || call.type}
                    </p>
                    <p className="text-sm text-gray-400">{formatDateTime(call.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeWaiterCall(call.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
                >
                  Tamam
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-6">
        {/* Left - Tables Grid */}
        <div className="flex-1">
          {/* Section Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {sections.map(section => (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSection === section
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {section}
              </button>
            ))}
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map(table => {
              const tableOrders = getTableOrders(table.number);
              const reservation = getTableReservation(table.number);
              const hasReadyOrder = tableOrders.some(o => o.status === 'ready');
              const totalAmount = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
              const effectiveStatus = getEffectiveStatus(table);
              const statusConfig = tableStatusConfig[effectiveStatus] || tableStatusConfig.available;

              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${statusConfig.bg} ${
                    hasReadyOrder ? 'ring-2 ring-green-500 animate-pulse' : ''
                  }`}
                >
                  {/* Ready Order Indicator */}
                  {hasReadyOrder && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Table Number */}
                  <div className="text-3xl font-bold mb-1">{table.number}</div>

                  {/* Section & Capacity */}
                  <div className="text-xs text-gray-400 mb-2">
                    {table.section} • {table.capacity} kişilik
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>

                  {/* Guest Count */}
                  {(table.current_guests > 0 || table.customer_name) && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{table.current_guests || 1} kişi</span>
                    </div>
                  )}

                  {/* Customer Name */}
                  {table.customer_name && (
                    <div className="mt-1 text-xs text-blue-400 truncate">
                      👤 {table.customer_name}
                    </div>
                  )}

                  {/* Order Total */}
                  {totalAmount > 0 && (
                    <div className="mt-2 text-lg font-bold text-orange-400">
                      {formatCurrency(totalAmount)}
                    </div>
                  )}

                  {/* Reservation Info */}
                  {reservation && (effectiveStatus === 'reserved' || table.status === 'reserved') && (
                    <div className="mt-2 p-2 bg-amber-500/30 rounded-lg text-xs">
                      <div className="flex items-center gap-1 text-amber-300">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(reservation.time)}</span>
                      </div>
                      <div className="text-amber-200 truncate">
                        {reservation.customer_name} ({reservation.party_size} kişi)
                      </div>
                    </div>
                  )}

                  {/* Order Count */}
                  {tableOrders.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {tableOrders.length} sipariş
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredTables.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Coffee className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Bu bölümde masa bulunamadı</p>
            </div>
          )}
        </div>

        {/* Right - Active Orders */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gray-800 rounded-2xl p-4 sticky top-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              Aktif Siparişler ({orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length})
            </h2>

            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {orders
                .filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
                .map(order => {
                  const statusConf = orderStatusConfig[order.status] || orderStatusConfig.pending;
                  
                  return (
                    <div
                      key={order.id}
                      className={`p-3 rounded-xl transition-all ${
                        order.status === 'ready' 
                          ? 'bg-green-500/20 border-2 border-green-500 animate-pulse' 
                          : order.status === 'pending'
                          ? 'bg-amber-500/20 border border-amber-500/50'
                          : 'bg-gray-700/50 border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">{order.order_number}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${statusConf.bg} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-1">
                        Masa {order.table_number}
                        {order.customer_name && ` • ${order.customer_name}`}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        {order.items?.slice(0, 2).map((item, i) => (
                          <span key={i}>
                            {item.quantity}x {item.product_name}
                            {i < Math.min((order.items?.length || 0), 2) - 1 ? ', ' : ''}
                          </span>
                        ))}
                        {(order.items?.length || 0) > 2 && ` +${(order.items?.length || 0) - 2}`}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-400">
                          {formatCurrency(order.total)}
                        </span>
                        
                        {order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'served')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium"
                          >
                            Servis Et
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aktif sipariş yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Action Modal */}
      {selectedTable && (
        <TableActionModal
          table={selectedTable}
          orders={getTableOrders(selectedTable.number)}
          reservation={getTableReservation(selectedTable.number)}
          effectiveStatus={getEffectiveStatus(selectedTable)}
          onClose={() => setSelectedTable(null)}
          onStatusChange={(status) => updateTableStatus(selectedTable.id, status)}
          onAddGuest={() => addGuestToTable(selectedTable)}
          onNewOrder={() => setShowNewOrderModal(true)}
        />
      )}

      {/* New Order Modal */}
      {showNewOrderModal && selectedTable && currentVenue && (
        <NewOrderModal
          table={selectedTable}
          products={products}
          categories={categories}
          venueId={currentVenue.id}
          onClose={() => {
            setShowNewOrderModal(false);
            setSelectedTable(null);
          }}
          onSuccess={() => {
            setShowNewOrderModal(false);
            setSelectedTable(null);
            loadOrders();
            loadTables();
          }}
        />
      )}
    </div>
  );
}

// =============================================
// TABLE ACTION MODAL
// =============================================
function TableActionModal({
  table,
  orders,
  reservation,
  effectiveStatus,
  onClose,
  onStatusChange,
  onAddGuest,
  onNewOrder,
}: {
  table: TableData;
  orders: Order[];
  reservation?: Reservation;
  effectiveStatus: string;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onAddGuest: () => void;
  onNewOrder: () => void;
}) {
  const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const guestCount = table.current_guests || 0;
  const statusConfig = tableStatusConfig[effectiveStatus] || tableStatusConfig.available;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${statusConfig.bg}`}>
              {table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Masa {table.number}</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {table.section} • {table.capacity} kişilik
                {guestCount > 0 && ` • ${guestCount} kişi oturuyor`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          {table.customer_name && (
            <div className="flex items-center gap-3 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-medium text-blue-300">{table.customer_name}</p>
                <p className="text-sm text-gray-400">{guestCount || 1} kişi</p>
              </div>
            </div>
          )}

          {/* Reservation Info */}
          {reservation && (
            <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span className="font-medium text-amber-400">Rezervasyon Bilgisi</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-medium">{formatTime(reservation.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{reservation.customer_name} - {reservation.party_size} kişi</span>
                </div>
                {reservation.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{reservation.customer_phone}</span>
                  </div>
                )}
                {reservation.notes && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">{reservation.notes}</span>
                  </div>
                )}
                {reservation.special_requests && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">{reservation.special_requests}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onNewOrder}
                className="flex items-center justify-center gap-2 p-4 bg-orange-600 hover:bg-orange-500 rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                {orders.length > 0 ? 'Ürün Ekle' : 'Sipariş Al'}
              </button>
              <button
                onClick={onAddGuest}
                className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Kişi Ekle
              </button>
              {orders.length > 0 && (
                <button className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-colors col-span-2">
                  <CreditCard className="w-5 h-5" />
                  Hesap Al ({formatCurrency(totalAmount)})
                </button>
              )}
            </div>
          </div>

          {/* Current Orders */}
          {orders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Mevcut Siparişler</h3>
              <div className="p-4 bg-gray-700/50 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                {orders.flatMap(order => order.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="text-gray-400">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-600 flex justify-between font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-400">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Change */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Durum Değiştir</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(tableStatusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`p-3 rounded-xl font-medium transition-colors ${
                    effectiveStatus === status 
                      ? `${config.bg} ring-2 ring-white/50` 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// NEW ORDER MODAL
// =============================================
function NewOrderModal({
  table,
  products,
  categories,
  venueId,
  onClose,
  onSuccess,
}: {
  table: TableData;
  products: Product[];
  categories: Category[];
  venueId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerName, setCustomerName] = useState(table.customer_name || '');
  const [guestCount, setGuestCount] = useState(table.current_guests || 1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        product_id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        notes: ''
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(item => item.product_id === productId 
        ? { ...item, quantity: item.quantity + delta } 
        : item
      )
      .filter(item => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(cartTotal * 0.08 * 100) / 100;
  const grandTotal = Math.round((cartTotal + tax) * 100) / 100;

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('Sepet boş');
      return;
    }
    
    setSubmitting(true);

    try {
      // Order items - Supabase şemasına uygun format
      const orderItems: OrderItem[] = cart.map(item => ({
        product_id: item.product_id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        notes: item.notes || '',
        status: 'pending',
      }));

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          venue_id: venueId,
          table_id: table.id,
          table_number: table.number,
          order_number: generateOrderNumber(),
          type: 'dine_in',
          status: 'pending',
          items: orderItems,
          subtotal: cartTotal,
          tax: tax,
          service_charge: 0,
          discount: 0,
          total: grandTotal,
          payment_status: 'pending',
          priority: 'normal',
          customer_name: customerName || null,
          notes: orderNote || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order create error:', orderError);
        throw new Error(orderError.message);
      }

      console.log('Order created:', orderData);

      // Update table status
      const { error: tableError } = await supabase
        .from('tables')
        .update({
          status: 'occupied',
          current_guests: guestCount,
          customer_name: customerName || null,
          seated_at: new Date().toISOString(),
        })
        .eq('id', table.id);

      if (tableError) {
        console.error('Table update error:', tableError);
        // Order created but table update failed - continue anyway
      }

      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Sipariş oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-xl font-bold">
              {table.number}
            </div>
            <div>
              <h2 className="text-xl font-bold">Masa {table.number} - Yeni Sipariş</h2>
              <p className="text-sm text-gray-400">{table.section} • {table.capacity} kişilik</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left - Products */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-gray-700">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Müşteri Adı</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Müşteri adı..."
                  className="w-full px-4 py-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-orange-500 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Kişi Sayısı</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                  <button
                    onClick={() => setGuestCount(guestCount + 1)}
                    className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full pl-12 pr-4 py-3 bg-gray-700 rounded-xl border border-gray-600 focus:border-orange-500 outline-none text-white"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Tümü
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id ? 'bg-orange-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-left transition-colors"
                >
                  <p className="font-medium mb-1 text-white">{product.name}</p>
                  <p className="text-orange-400 font-bold">{formatCurrency(product.price)}</p>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ürün bulunamadı</p>
              </div>
            )}
          </div>

          {/* Right - Cart */}
          <div className="w-80 flex-shrink-0 flex flex-col bg-gray-850">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold flex items-center gap-2 text-white">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                Sepet ({cart.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product_id} className="p-3 bg-gray-700/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{item.name}</span>
                        <span className="text-orange-400 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          className="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Sepet boş</p>
                  <p className="text-sm">Ürün eklemek için tıklayın</p>
                </div>
              )}
            </div>

            {/* Order Note */}
            <div className="p-4 border-t border-gray-700">
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Sipariş notu..."
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm resize-none text-white placeholder-gray-400"
                rows={2}
              />
            </div>

            {/* Totals & Submit */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ara Toplam</span>
                  <span className="text-white">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">KDV (%8)</span>
                  <span className="text-white">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                  <span className="text-white">Toplam</span>
                  <span className="text-orange-400">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitting}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Siparişi Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}