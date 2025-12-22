'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  UtensilsCrossed,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Phone,
  MapPin,
  User,
  CreditCard,
  Banknote,
  QrCode,
  X,
  ChevronDown,
  Plus,
  Minus,
  Printer
} from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
type OrderType = 'dine_in' | 'takeaway' | 'delivery';
type PaymentStatus = 'pending' | 'paid' | 'refunded';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  venue_id: string;
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; bgColor: string }> = {
  pending: { label: 'Bekliyor', color: 'text-amber-600', icon: Clock, bgColor: 'bg-amber-50' },
  confirmed: { label: 'Onaylandı', color: 'text-blue-600', icon: CheckCircle, bgColor: 'bg-blue-50' },
  preparing: { label: 'Hazırlanıyor', color: 'text-purple-600', icon: ChefHat, bgColor: 'bg-purple-50' },
  ready: { label: 'Hazır', color: 'text-green-600', icon: CheckCircle, bgColor: 'bg-green-50' },
  served: { label: 'Servis Edildi', color: 'text-teal-600', icon: UtensilsCrossed, bgColor: 'bg-teal-50' },
  completed: { label: 'Tamamlandı', color: 'text-gray-600', icon: CheckCircle, bgColor: 'bg-gray-50' },
  cancelled: { label: 'İptal', color: 'text-red-600', icon: XCircle, bgColor: 'bg-red-50' },
};

const typeConfig: Record<OrderType, { label: string; icon: any; color: string }> = {
  dine_in: { label: 'Masada', icon: UtensilsCrossed, color: 'bg-blue-100 text-blue-700' },
  takeaway: { label: 'Paket', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  delivery: { label: 'Teslimat', icon: Truck, color: 'bg-green-100 text-green-700' },
};

// Demo siparişler
const demoOrders: Order[] = [
  {
    id: '1',
    order_number: 'ORD-001',
    venue_id: '1',
    table_number: '5',
    type: 'dine_in',
    status: 'pending',
    items: [
      { id: '1', name: 'Izgara Levrek', quantity: 2, price: 850 },
      { id: '2', name: 'Caesar Salata', quantity: 1, price: 280 },
      { id: '3', name: 'Efes Pilsen', quantity: 4, price: 120 },
    ],
    subtotal: 2260,
    tax: 181,
    total: 2441,
    payment_status: 'pending',
    notes: 'Balık çok pişmiş olmasın',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_number: 'ORD-002',
    venue_id: '1',
    table_number: '12',
    type: 'dine_in',
    status: 'preparing',
    items: [
      { id: '1', name: 'Karışık Izgara', quantity: 2, price: 950 },
      { id: '2', name: 'Pilav', quantity: 2, price: 150 },
      { id: '3', name: 'Ayran', quantity: 4, price: 50 },
    ],
    subtotal: 2400,
    tax: 192,
    total: 2592,
    payment_status: 'pending',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    order_number: 'ORD-003',
    venue_id: '1',
    customer_name: 'Ahmet Yılmaz',
    customer_phone: '0532 123 4567',
    type: 'takeaway',
    status: 'ready',
    items: [
      { id: '1', name: 'Adana Kebap', quantity: 3, price: 550 },
      { id: '2', name: 'Lahmacun', quantity: 5, price: 120 },
    ],
    subtotal: 2250,
    tax: 180,
    total: 2430,
    payment_status: 'paid',
    payment_method: 'card',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    order_number: 'ORD-004',
    venue_id: '1',
    customer_name: 'Ayşe Demir',
    customer_phone: '0533 987 6543',
    customer_address: 'Beşiktaş Mah. Çınar Sok. No:15 D:4',
    type: 'delivery',
    status: 'confirmed',
    items: [
      { id: '1', name: 'Pizza Margherita', quantity: 2, price: 340 },
      { id: '2', name: 'Kola', quantity: 2, price: 60 },
    ],
    subtotal: 800,
    tax: 64,
    total: 864,
    payment_status: 'paid',
    payment_method: 'tit_pay',
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    order_number: 'ORD-005',
    venue_id: '1',
    table_number: '3',
    type: 'dine_in',
    status: 'served',
    items: [
      { id: '1', name: 'Biftek', quantity: 2, price: 1200 },
      { id: '2', name: 'Şarap (Şişe)', quantity: 1, price: 850 },
    ],
    subtotal: 3250,
    tax: 260,
    total: 3510,
    payment_status: 'pending',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    order_number: 'ORD-006',
    venue_id: '1',
    table_number: '8',
    type: 'dine_in',
    status: 'completed',
    items: [
      { id: '1', name: 'Humus', quantity: 2, price: 280 },
      { id: '2', name: 'Kalamar Tava', quantity: 1, price: 520 },
    ],
    subtotal: 1080,
    tax: 86,
    total: 1166,
    payment_status: 'paid',
    payment_method: 'cash',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function OrdersPage() {
  const { currentVenue, venues } = useVenueStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Supabase'den siparişleri yükle
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Eğer mekan seçiliyse filtrele, yoksa tüm mekanları getir
      if (currentVenue) {
        query = query.eq('venue_id', currentVenue.id);
      } else if (venues.length > 0) {
        // Kullanıcının erişimi olan tüm mekanların siparişlerini getir
        const venueIds = venues.map(v => v.id);
        query = query.in('venue_id', venueIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading orders:', error);
        // Hata durumunda demo data göster
        setOrders(demoOrders);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setOrders(demoOrders);
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue, venues]);

  // Sayfa yüklendiğinde ve venue değiştiğinde siparişleri yükle
  useEffect(() => {
    loadOrders();

    // Real-time subscription
    const venueFilter = currentVenue 
      ? `venue_id=eq.${currentVenue.id}`
      : venues.length > 0 
        ? `venue_id=in.(${venues.map(v => v.id).join(',')})`
        : undefined;

    if (venueFilter) {
      const channel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: venueFilter,
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadOrders, currentVenue, venues]);

  // Siparişleri filtrele
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Aktif siparişler (tamamlanmamış)
  const activeOrders = filteredOrders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = filteredOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  // Sipariş durumunu güncelle
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
        : order
    ));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Sonraki durum
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'completed',
      completed: null,
      cancelled: null,
    };
    return flow[currentStatus];
  };

  // Zaman hesapla
  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

  // İstatistikler
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    total: activeOrders.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-gray-500">{currentVenue?.name || 'Tüm Mekanlar'} • {activeOrders.length} aktif sipariş</p>
        </div>
        <button 
          onClick={() => setIsLoading(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-sm text-amber-600">Bekleyen</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.preparing}</p>
              <p className="text-sm text-purple-600">Hazırlanıyor</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.ready}</p>
              <p className="text-sm text-green-600">Hazır</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              <p className="text-sm text-blue-600">Toplam Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Sipariş no, müşteri adı veya masa ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
          className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 bg-white"
        >
          <option value="all">Tüm Durumlar</option>
          {Object.entries(statusConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as OrderType | 'all')}
          className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 bg-white"
        >
          <option value="all">Tüm Tipler</option>
          {Object.entries(typeConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Sipariş Listesi */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sipariş</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tip</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Müşteri/Masa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ürünler</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tutar</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Zaman</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map(order => {
                const statusInfo = statusConfig[order.status] || statusConfig['pending'];
                const typeInfo = typeConfig[order.type] || typeConfig['dine_in'];
                const StatusIcon = statusInfo?.icon || Clock;
                const TypeIcon = typeInfo?.icon || UtensilsCrossed;
                const nextStatus = getNextStatus(order.status);

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.type === 'dine_in' ? (
                        <span className="font-medium">Masa {order.table_number}</span>
                      ) : (
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-gray-500">{order.customer_phone}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">
                        {order.items.length} ürün
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">₺{order.total.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">{getTimeAgo(order.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {nextStatus && (
                          <button
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                            className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
                          >
                            {statusConfig[nextStatus].label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Sipariş bulunamadı</p>
          </div>
        )}
      </div>

      {/* Sipariş Detay Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
        />
      )}
    </div>
  );
}

// Sipariş Detay Modal
function OrderDetailModal({ 
  order, 
  onClose, 
  onUpdateStatus 
}: { 
  order: Order; 
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  const statusInfo = statusConfig[order.status];
  const typeInfo = typeConfig[order.type];
  const StatusIcon = statusInfo.icon;
  const nextStatus = order.status !== 'completed' && order.status !== 'cancelled' 
    ? (['pending', 'confirmed', 'preparing', 'ready', 'served'] as OrderStatus[])
        .find((s, i, arr) => arr[i - 1] === order.status) || null
    : null;

  const paymentIcons: Record<string, any> = {
    cash: Banknote,
    card: CreditCard,
    tit_pay: QrCode,
  };
  const PaymentIcon = order.payment_method ? paymentIcons[order.payment_method] || CreditCard : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{order.order_number}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Müşteri/Masa Bilgisi */}
          <div className="bg-gray-50 rounded-xl p-4">
            {order.type === 'dine_in' ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">#{order.table_number}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Masa {order.table_number}</p>
                  <p className="text-sm text-gray-500">Masada yemek</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.customer_phone}</span>
                </div>
                {order.customer_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{order.customer_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ürünler */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Ürünler</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center font-bold text-orange-600">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.notes && <p className="text-xs text-amber-600">📝 {item.notes}</p>}
                    </div>
                  </div>
                  <span className="font-medium text-gray-700">₺{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notlar */}
          {order.notes && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800">📝 Not: {order.notes}</p>
            </div>
          )}

          {/* Ödeme */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ara Toplam</span>
              <span>₺{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">KDV (%8)</span>
              <span>₺{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Toplam</span>
              <span className="text-orange-600">₺{order.total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-gray-500">Ödeme Durumu</span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {PaymentIcon && <PaymentIcon className="w-3 h-3" />}
                {order.payment_status === 'paid' ? 'Ödendi' : 'Bekliyor'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-100 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" />
            Yazdır
          </button>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <>
              <button
                onClick={() => { onUpdateStatus(order.id, 'cancelled'); onClose(); }}
                className="px-4 py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50"
              >
                İptal
              </button>
              {nextStatus && (
                <button
                  onClick={() => { onUpdateStatus(order.id, nextStatus); }}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
                >
                  {statusConfig[nextStatus].label} Yap
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
